"use strict"

var $counter = document.getElementById("counter")
var $comments = document.getElementById("comments")
var $webhook_destination = document.getElementById("webhook_destination")

document.getElementById("inc").addEventListener("click", inc)
document.getElementById("dec").addEventListener("click", dec)
document.getElementById("dl").addEventListener("click", dl)
document.getElementById("clear").addEventListener("click", clear)
document.getElementById("savecomments").addEventListener("click", save_comments)
document.getElementById("ul").addEventListener("click", sendHook)
document.getElementById("menu").addEventListener("click", toggleMenu)
document.getElementById("save_zap").addEventListener("click", save_webhook_destination)

window.addEventListener("load", render)

function inc() {
    chrome.storage.sync.get("counter", function(data) { ("counter" in data ? set(data["counter"] + 1) : set(1)) })
}

function dec() {
   chrome.storage.sync.get("counter", function(data) { ("counter" in data ? set(data["counter"] - 1) : set(1)) })
}

function clear() {
   set(0)
   clear_comments()
}

function set(e) {
    e<0 ? e=0 : 999<e && (e=999), chrome.storage.sync.set({"counter":e},function(){render()})
}

function render() {
    chrome.storage.sync.get("counter",function(e) {
        $counter.innerText="counter" in e ? e.counter : 0,
        chrome.browserAction.setBadgeText({text:$counter.innerText}),
        chrome.browserAction.setBadgeBackgroundColor({color:"red"})
    })

    chrome.storage.sync.get("comments",function(e) {
        $comments.value = ("comments" in e ? e.comments : "")
    })

    chrome.storage.sync.get("webhook_destination",function(e) {
        $webhook_destination.value = ("webhook_destination" in e ? e.webhook_destination : "")
    })

    if($webhook_destination === "") {document.getElementById("ul").disabled = true}
}

function save_comments() {
    chrome.storage.sync.set({ "comments": $comments.value })
}

function clear_comments() {
    chrome.storage.sync.set({ "comments": "" })
}

function save_webhook_destination() {
    chrome.storage.sync.set({ "webhook_destination": $webhook_destination.value })
}

function content_for_dl(format) {
    var content
    var today = new Date()
    var dd = today.getDate(), mm = today.getMonth() + 1, yyyy = today.getFullYear()
    if (dd < 10) {dd = '0' + dd}
    if (mm < 10) {mm = '0' + mm}
    var today = yyyy + mm + dd

    if (format == "csv") {
        content = `date,count,comments\n`
        content += today + "," + $counter.innerText + "," + $comments.value
    } else if (format == "json") {
        content = JSON.stringify({
            date: today,
            count: $counter.innerText,
            comments: $comments.value
        })
    }
    return content
}

function dl() {
    var content = content_for_dl("csv")
    var element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content))
    element.setAttribute('download', "qTrack_export.csv")
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
}


function sendHook(destination) {
    var content = content_for_dl("json")
    var xhr = new XMLHttpRequest()
    xhr.open('POST', $webhook_destination.value)
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        var response = xhr.responseText
        console.log(response)
          if (xhr.status === 200) {}
          else {alert("FAILED! Check your Webhook destination. " + "\n" + xhr.status + " - " + response.status)}
      }
    }
    xhr.send(content)
}

function toggleMenu() {
    var menu = document.getElementById("menu-hidden");
    if (menu.style.display === "none") {
        menu.style.display = "block";
    } else {
        menu.style.display = "none";
    }
}

