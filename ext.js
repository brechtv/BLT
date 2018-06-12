"use strict"

var $counter = document.getElementById("counter")
var $comments = document.getElementById("comments")
var $asker = document.getElementById("asker")
var $webhook_destination = document.getElementById("webhook_destination")

document.getElementById("inc1").addEventListener("click", inc1)
document.getElementById("inc2").addEventListener("click", inc2)
document.getElementById("inc5").addEventListener("click", inc5)
document.getElementById("inc10").addEventListener("click", inc10)


document.getElementById("dec").addEventListener("click", dec)
document.getElementById("dl").addEventListener("click", dl)
document.getElementById("clear").addEventListener("click", clear)
document.getElementById("savecomments").addEventListener("click", save_comments)
document.getElementById("ul").addEventListener("click", sendHook)
document.getElementById("menu").addEventListener("click", toggleMenu)
document.getElementById("save_zap").addEventListener("click", save_webhook_destination)

window.addEventListener("load", render)

function inc1() {
    chrome.storage.sync.get("counter", function(data) {
        ("counter" in data ? set(data["counter"] + 1) : set(1))
    })
    incdone()
}

function inc2() {
    chrome.storage.sync.get("counter", function(data) {
        ("counter" in data ? set(data["counter"] + 2) : set(1))
    })
    incdone()
}

function inc5() {
    chrome.storage.sync.get("counter", function(data) {
        ("counter" in data ? set(data["counter"] + 5) : set(1))
    })
    incdone()
}

function inc10() {
    chrome.storage.sync.get("counter", function(data) {
        ("counter" in data ? set(data["counter"] + 10) : set(1))
    })
    incdone()
}

function incdone() {
    var sc_arr = ["Another one!", "There we go!", "Hurray!", "One more!", "Yee-haw", "Bring em on!",
        "Crazy talk!", "MOAR", "Hold the phone!", "Da-yum!", "Ludicrous", "Are you crazy?"
    ]
    var msg = sc_arr[Math.floor(Math.random() * sc_arr.length)]
    showAlert(msg, "alert-smurf")
}

function dec() {
    chrome.storage.sync.get("counter", function(data) {
        ("counter" in data ? set(data["counter"] - 1) : set(1))
    })
}

function add(value) {
    chrome.storage.sync.get("counter", function(data) {
        ("counter" in data ? set(data["counter"] + value) : set(1))
    })
}

function clear() {
    try {
        set(0)
        clear_comments()
        showAlert("[SUCCESS] All clear", "alert-smurf")
    } catch (err) {
        showAlert("[FAILED] Uh oh. Something went wrong." + err, "alert-smurf")
    }
}

function set(e) {
    e < 0 ? e = 0 : 999 < e && (e = 999), chrome.storage.sync.set({
        "counter": e
    }, function() {
        render()
    })
}

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

    chrome.storage.sync.get("comments", function(e) {
        $comments.value = ("comments" in e ? e.comments : "")
    })

    chrome.storage.sync.get("asker", function(e) {
        $asker.value = ("asker" in e ? e.asker : "")
    })

    chrome.storage.sync.get("webhook_destination", function(e) {
        $webhook_destination.value = ("webhook_destination" in e ? e.webhook_destination : "")
    })

    if ($webhook_destination === "") {
        document.getElementById("ul").disabled = true
    }
}

function save_comments() {
    try {
        chrome.storage.sync.set({
            "comments": $comments.value
        })
        chrome.storage.sync.set({
            "asker": $asker.value
        })
        showAlert("[SUCCESS] Saved comments", "alert-smurf")
    } catch (err) {
        showAlert("[SUCCESS] Uh oh. Something went wrong" + err, "alert-smurf")
    }
}

function clear_comments() {
    chrome.storage.sync.set({
        "comments": ""
    })
    chrome.storage.sync.set({
        "asker": ""
    })
}

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

function content_for_dl(format) {
    var content
    var today = getDateFormatted()
    if (format == "csv") {
        content = `date,count,asker,comments\n`
        content += today + "," + $counter.innerText + "," + $asker.value + "," + $comments.value
    } else if (format == "json") {
        content = JSON.stringify({
            date: today,
            count: $counter.innerText,
            asker: $asker.value,
            comments: $comments.value
        })
    }
    return content
}

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
