var ReplyTracker = function() {
  this.loadTracker();
}

ReplyTracker.prototype.user_options = [
  // these two options must be the first in the array!
  { name: "show_profile", label: "Display on your profile", default: "yes" },
  { name: "show_home", label: "Display on your home page", default: "yes" },

  // these options are not visible in the "Settings"
  { name: "@index", label: "Index", default: 0, hidden: true },
  
  { name: "@max_length", label: "Max. rows", default: 5 },
  { name: "@update_interval", label: "Update interval (sec)", default: 60 },
  { name: "@show_date", label: "Show dates (yes/no)", default: "yes" },
  { name: "@show_user", label: "Show usernames (yes/no)", default: "yes" },
  { name: "@show_read", label: "Show read threads (yes/no)", default: "yes" },
  { name: "@show_spam", label: "Show spammed threads (yes/no)", default: "no" }
];

ReplyTracker.prototype.options = new Object();
ReplyTracker.prototype.elements = new Object();
ReplyTracker.prototype.threads = new Array();

ReplyTracker.prototype.loadTracker = function() {
  if (!unsafeWindow.LFM || !unsafeWindow.LFM.Session || !unsafeWindow.LFM.Session.userName) return;

  this.options.username = unsafeWindow.LFM.Session.userName;
  if(GM_getValue("show_profile", this.user_options[0].default) == "yes" && this.isOwnProfile(this.options.username)) {
    this.target = "profile";
  } else if(GM_getValue("show_home", this.user_options[1].default) && document.location.href.indexOf("/home") != -1) {
    this.target = "home";
  } else {
    return;
  }

  this.loadOptions();
  this.updateFeed();
}

ReplyTracker.prototype.reloadTracker = function() {
  delete this.threads;
  this.threads = new Array();
  this.options = new Object();
  this.loadTracker();
}

ReplyTracker.prototype.loadOptions = function() {
  for(var i = 0, c = this.user_options.length, name; i < c; i++) {
    name = this.user_options[i].name;
    this.options[name.replace(/@/g, "")] = GM_getValue(name.replace(/@/g, this.target+"_"), this.user_options[i].default);
  }
  return true;
}

ReplyTracker.prototype.isOwnProfile = function(username) {
  var page_username = document.location.href.replace(/^.*?\/user\/(.+?)((#|\/).*|$)/, "$1");
  return username === page_username;
}

ReplyTracker.prototype.showOptions = function() {
  if(!this.buildOptions())
    this.elements.options.style.display = "block";
  if(typeof this.elements.feed != "undefined")
    this.elements.feed.style.display = "none";
  this.stopUpdater();
}

ReplyTracker.prototype.buildBody = function() {
  if(typeof this.elements.body != "undefined")
    return false;
  var klass = this,
      first = this.getSibling();

  this.elements.header = document.createElement("h2");
  this.elements.header.setAttribute("id", "gmreplytracker");
  this.elements.header.setAttribute("class", "heading");
  this.elements.header.innerHTML = '<span class="h2Wrapper"><span style="float:right;font-weight:normal;font-size:11px;"><a class="mEdit icon" href="#" style="background:url(http://cdn.last.fm/flatness/icons/settings.2.png) left center no-repeat;padding-left: 12px;"><span>Settings</span></a></span><a href="/user/' + this.options.username + '/replytracker" title="">Reply Tracker</a></span>';
  
  this.elements.header.firstChild.firstChild.firstChild.addEventListener("click", function(e) {
    klass.showOptions.apply(klass);
    e.preventDefault();
    return false;
  }, false);
  
  this.elements.body = document.createElement("div");
  this.elements.footer = document.createElement("div");
  this.elements.footer.style.textAlign = "right";
  var button_down = document.createElement("a");
  button_down.href = "#";
  button_down.innerHTML = "&darr;";
  button_down.style.padding = "3px 6px";
  button_down.style.marginRight = "4px";
  button_down.style.backgroundColor = "#eee";
  button_down.addEventListener("click", function(e) {
    e.preventDefault();
    var index = klass.options["index"] = parseInt(klass.options["index"]) + 1;
    GM_setValue(klass.target+"_index", index);
    klass.updateBody.call(klass);
  }, false);
  
  var button_up = document.createElement("a");
  button_up.href = "#";
  button_up.innerHTML = "&uarr;";
  button_up.style.padding = "3px 6px";
  button_up.style.marginRight = "4px";
  button_up.style.backgroundColor = "#eee";
  button_up.addEventListener("click", function(e) {
    e.preventDefault();
    var index = parseInt(klass.options["index"]) - 1;
    if(index < 0)
      return;
    klass.options["index"] = index;
    GM_setValue(klass.target+"_index", index);
    klass.updateBody.call(klass);
  }, false);
  
  this.elements.footer.appendChild(button_down);
  this.elements.footer.appendChild(button_up);

  if(this.target == "home") {
    var body = document.createElement("div");
    body.setAttribute("id", "gmreplytracker");
    body.setAttribute("class", "home-group");

    var header = document.createElement("div");
    header.setAttribute("class", "home-group-header");
    header.appendChild(this.elements.header);

    var content = document.createElement("div");
    content.setAttribute("class", "home-group-content");
    content.appendChild(this.elements.body);
    content.appendChild(this.elements.footer);

    body.appendChild(header);
    body.appendChild(content);
    first.parentNode.insertBefore(body, first);
  }
  else {
    first.parentNode.insertBefore(this.elements.header, first);
    first.parentNode.insertBefore(this.elements.body, first);
    first.parentNode.insertBefore(this.elements.footer, first);
  }
  return true;
}

ReplyTracker.prototype.getSibling = function() {
  var element;
  var index = GM_getValue(this.target+"_index", 0);
  var first = document.getElementById("LastAd_mpu").nextElementSibling;

  if(this.target == "profile") {
    while((first.id == "gmreplytracker" || (first.className != "first heading" && first.className != "heading" && first.className != "module" || index-- > 0)) && first.nextElementSibling) 
      first = first.nextElementSibling;
  }
  else {
    while((first.id == "gmreplytracker" || (index-- > 0)) && first.nextElementSibling) 
      first = first.nextElementSibling;
  }
  if(index > 0) {
    this.options["index"] = GM_getValue(this.target+"_index", index) - index;
    GM_setValue(this.target+"_index", this.options["index"]);
  }
  return first;
}

ReplyTracker.prototype.updateBody = function() {
  var first = this.getSibling();
  if(this.target == "home") {
    first.parentNode.insertBefore(this.elements.header.parentNode.parentNode, first);
  }
  else {
    first.parentNode.insertBefore(this.elements.header, first);
    first.parentNode.insertBefore(this.elements.body, first);
    first.parentNode.insertBefore(this.elements.footer, first);
  }
}

ReplyTracker.prototype.buildOptions = function() {
  if(typeof this.elements.options != "undefined")
    return false;
  var klass = this;
  this.buildBody();
  this.elements.options = document.createElement("ul");
  for(var i = 0, c = this.user_options.length, li, label, input, name; i < c; i++) {
    if(this.user_options[i].hidden)
      continue;
    name = this.user_options[i].name.replace(/@/g, "");
    li = document.createElement("li");
    li.style.lineHeight = "25px";
    label = document.createElement("label");
    label.innerHTML = this.user_options[i].label;
    label.setAttribute("for", name);
    input = document.createElement("input");
    if(typeof this.options[name] != "undefined")
      input.setAttribute("value", this.options[name]);
    with(input) {
      setAttribute("id", name);
      setAttribute("name", name);
      setAttribute("size", 4);
      with(style) {
        border = "1px solid #999";
        background = "#fff";
        color = "#222";
        cssFloat = "right";
      }
    }
    this.user_options[i].element = input;
    li.appendChild(input);
    li.appendChild(label);
    this.elements.options.appendChild(li);
  }
  
  li = document.createElement("li");
  li.style.textAlign = "center";
  input = document.createElement("input");
  input.setAttribute("type", "button");
  input.setAttribute("value", "Save Options");
  input.addEventListener("click", function() {
    klass.saveOptions.apply(klass);
    return false;
  }, false);
  li.appendChild(input);
  this.elements.options.appendChild(li);
  
  this.elements.body.appendChild(this.elements.options);
  return true;
}

ReplyTracker.prototype.buildFeed = function() {
  if(typeof this.elements.feed != "undefined")
    return false;
  this.buildBody();
  this.elements.feed = document.createElement("ul");
  this.elements.feed.className = "minifeedSmall";
  this.elements.body.appendChild(this.elements.feed);
  return true;
}

ReplyTracker.prototype.saveOptions = function() {
  for(var i = 0, l = this.user_options.length, name, value; i < l; i++) {
    if(this.user_options[i].hidden)
      continue;
    name = this.user_options[i].name;
    value = this.user_options[i].element.value;
    this.options[name.replace(/@/, "")] = value;
    GM_setValue(name.replace(/@/, this.target+"_"), value);
  }
  this.elements.options.style.display = "none";
  if(typeof this.elements.feed != "undefined")
    this.elements.feed.style.display = "block";
  this.reloadTracker();
}

ReplyTracker.prototype._feed = function() {
  return "http://ws.audioscrobbler.com/1.0/user/" + this.options.username + "/replytracker.rss";
}

ReplyTracker.prototype.startUpdater = function() {
  var klass = this;
  if(!this.update)
    this.update = window.setInterval(function() {
      klass.updateFeed.apply(klass);
    }, this.options.update_interval * 1000);
}

ReplyTracker.prototype.stopUpdater = function() {
  window.clearInterval(this.update);
  delete this.update;
}

ReplyTracker.prototype.updateFeed = function() {
  this.getFeed(this._feed());
}

ReplyTracker.prototype.getFeed = function(feed_url) {
  var klass = this;
  this.buildFeed();
  GM_xmlhttpRequest({
    "method": "GET",
    "url": feed_url,
    "onload": function(response) {
      var parser = new DOMParser();
      var xmlDoc = parser.parseFromString(response.responseText, "text/xml"); 
      klass.processFeed.call(klass, xmlDoc);
    },
    "onerror": function() {
    }
  });
  this.startUpdater();
}

ReplyTracker.prototype.processFeed = function(xml) {
  this.elements.feed.innerHTML = "";
  var feed = xml.getElementsByTagName("channel").item(0);
  var replies = feed.getElementsByTagName("item");
  var feed_length = this.options.max_length > replies.length ? replies.length : this.options.max_length;
  for(var i = 0, added = 0; i < replies.length && added < this.options.max_length; i++)
    added += this.addItem(replies[i]);
  if(this.threads.length > 0)
    this.threads[this.threads.length-1].elements.row.className = "last";
}

ReplyTracker.prototype.addItem = function(item) {
  var thread = new Thread({
    "title": item.getElementsByTagName("title").item(0).firstChild.data,
    "description": item.getElementsByTagName("description").item(0).firstChild.data,
    "url": item.getElementsByTagName("link").item(0).firstChild.data,
    "date": new Date(item.getElementsByTagName("pubDate").item(0).firstChild.data)
  }, this.options);
  
  if(thread.status == "read" && this.options.show_read == "no" || thread.status == "spam" && this.options.show_spam == "no")
    return false;
  
  this.elements.feed.appendChild(thread.elements.row);
  this.threads.push(thread);
  return true;
}
