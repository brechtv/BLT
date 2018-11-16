"use strict"

// ui elements
var $counter = document.getElementById("counter")
var $comments = document.getElementById("comments")
var $task = document.getElementById("task")
var $webhook_destination = document.getElementById("webhook_destination")

// button click listeners
// increment counter by n
document.getElementById("inc1").addEventListener("click", function(){ inc(1) })
document.getElementById("inc2").addEventListener("click", function(){ inc(2) })
document.getElementById("inc5").addEventListener("click", function(){ inc(5) })
document.getElementById("inc10").addEventListener("click", function(){ inc(10) })

// decrease counter
document.getElementById("dec").addEventListener("click", dec)

// download tracking data
document.getElementById("dl").addEventListener("click", dl)

// clear tracking data
document.getElementById("clear").addEventListener("click", clear)

// save comments
document.getElementById("savecomments").addEventListener("click", save_comments)

// send tracking data to webhook
document.getElementById("ul").addEventListener("click", sendHook)

// to set webhook destination
document.getElementById("menu").addEventListener("click", toggleMenu)

// to save the webhook destination
document.getElementById("save_zap").addEventListener("click", save_webhook_destination)

// on load, render
window.addEventListener("load", render)

// increment counter by n
function inc(n) {
    chrome.storage.sync.get("counter", function(data) {
        ("counter" in data ? set(data["counter"] + n) : set(1))
    })
    incdone()
}

// when increment is done
function incdone() {
    var sc_arr = ["Another one!", "There we go!", "Hurray!", "One more!", "Yee-haw", "Bring em on!",
        "Crazy talk!", "MOAR", "Hold the phone!", "Da-yum!", "Ludicrous", "Are you crazy?"
    ]
    var msg = sc_arr[Math.floor(Math.random() * sc_arr.length)]
    showAlert(msg, "alert-smurf")
}

// decrease counter
function dec() {
    chrome.storage.sync.get("counter", function(data) {
        ("counter" in data ? set(data["counter"] - 1) : set(1))
    })
}

// clear current counter
function clear() {
    try {
        set(0)
        clear_comments()
        showAlert("[SUCCESS] All clear", "alert-smurf")
    } catch (err) {
        showAlert("[FAILED] Uh oh. Something went wrong." + err, "alert-smurf")
    }
}

// set the counter with a value, used with inc()
function set(e) {
    e < 0 ? e = 0 : 999 < e && (e = 999), chrome.storage.sync.set({
        "counter": e
    }, function() {
        render()
    })
}

// render app ui with saved data from chrome storage if available
function render() {
    chrome.storage.sync.get("counter", function(e) {
        $counter.innerText = ("counter" in e ? e.counter : 0)
        if ($counter.innerText != 0) {
            chrome.browserAction.setBadgeText({
                text: $counter.innerText
            })
            chrome.browserAction.setBadgeBackgroundColor({
                color: "red"
            })
        } else {
            chrome.browserAction.setBadgeText({
                text: "0"
            })
            chrome.browserAction.setBadgeBackgroundColor({
                color: "green"
            })
        }
    })

    // commments for task, if available
    chrome.storage.sync.get("comments", function(e) {
        $comments.value = ("comments" in e ? e.comments : "")
    })
    // task name, if available
    chrome.storage.sync.get("task", function(e) {
        $task.value = ("task" in e ? e.task : "")
    })
    // get the webhook destination if available
    chrome.storage.sync.get("webhook_destination", function(e) {
        $webhook_destination.value = ("webhook_destination" in e ? e.webhook_destination : "")
    })
    // can't send to webhook if there isn't a destination
    if ($webhook_destination === "") {
        document.getElementById("ul").disabled = true
    }
}

// save task, saves to storage only
function save_comments() {
    try {
        chrome.storage.sync.set({
            "comments": $comments.value
        })
        chrome.storage.sync.set({
            "task": $task.value
        })
        showAlert("[SUCCESS] Saved comments", "alert-smurf")
    } catch (err) {
        showAlert("[SUCCESS] Uh oh. Something went wrong" + err, "alert-smurf")
    }
}

// clears task
function clear_comments() {
    chrome.storage.sync.set({
        "comments": ""
    })
    chrome.storage.sync.set({
        "task": ""
    })
}

// save the webhook destination
function save_webhook_destination() {
    try {
        chrome.storage.sync.set({
            "webhook_destination": $webhook_destination.value
        })
        showAlert("[SUCCESS] Saved webhook destination.", "alert-smurf")
    } catch (err) {
        showAlert("[FAILED] Uh oh. Something went wrong." + err, "alert-smurf")
    }
}

// create the content for download (csv or json)
function content_for_dl(format) {
    var content
    var today = getDateFormatted()
    if (format == "csv") {
        content = `date,count,task,comments\n`
        content += today + "," + $counter.innerText + "," + $task.value + "," + $comments.value
    } else if (format == "json") {
        content = JSON.stringify({
            date: today,
            count: $counter.innerText,
            task: $task.value,
            comments: $comments.value
        })
    }
    return content
}

// download the data
function dl() {
    try {
        var content = content_for_dl("csv")
        var element = document.createElement('a')
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content))
        element.setAttribute('download', "qTrack_export.csv")
        element.style.display = 'none'
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
        showAlert("[SUCCESS] File ready for download.", "alert-smurf")
    } catch (err) {
        showAlert("[FAILED] Could not download file." + err, "alert-smurf")
    }
}

// if you want to send it to a webhook
function sendHook() {
    save_comments()
    var content = content_for_dl("json")
    console.log(content)
    if ($webhook_destination.value == "") {
        showAlert("[FAILED] No webhook destination set.", "alert-smurf")
        return
    }

    var xhr = new XMLHttpRequest()
    xhr.open('POST', $webhook_destination.value)
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            var response = xhr.responseText
            console.log(response)
            if (xhr.status === 200) {
                showAlert("[SUCCESS] Synced to " + $webhook_destination.value, "alert-smurf")
                clear()
            } else {
                showAlert("[FAILED] Something went wrong. Check your webhook destination.", "alert-smurf")
            }
        }
    }
    xhr.send(content)
}

// helper functions
function toggleMenu() {
    var menu = document.getElementById("menu-hidden")
    if (menu.style.display === "none") {
        menu.style.display = "block"
    } else {
        menu.style.display = "none"
    }
}

function showAlert(msg, classname) {
    var s = document.getElementsByClassName("footer")[0]

    var x = document.createElement("div")
    x.classList.add("alert")
    x.innerText = getTimeFormatted() + " " + msg
    s.appendChild(x)
    s.scrollTop = s.scrollHeight
}

function getDateFormatted() {
    var today = new Date()
    var dd = today.getDate(),
        mm = today.getMonth() + 1,
        yyyy = today.getFullYear()
    if (dd < 10) {
        dd = '0' + dd
    }
    if (mm < 10) {
        mm = '0' + mm
    }
    var today = yyyy + "-" + mm + "-" + dd
    return today
}

function getTimeFormatted() {
    var now = new Date()
    var hr = now.getHours()
    var min = now.getMinutes()
    if (min < 10) {
        min = "0" + min
    }
    if (hr < 10) {
        hr = "0" + hr
    }
    now = hr + ":" + min
    return now
}

chrome.commands.onCommand.addListener(function(command) {
    if (command === "sync") {
        sendHook()
    }
})
