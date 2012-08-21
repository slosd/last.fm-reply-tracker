var Thread = function(properties, options) {
  this.options = options;
  this.elements = new Object();
  this.url = properties.url;
  var parts = this.url.replace(/^.*\/forum\/(\d+?)\/_\/(\d+?)\/_\/(\d+)$/, "$1,$2,$3").split(",");
  this.forum_id = parts[0];
  this.id = parts[1];
  this.last_post_id = parts[2];
  this.title = properties.title;
  this.title_short = this.title.replace(/^.*?\'(.*)\'$/, "$1");
  this.user = properties.description.replace(/^.*<a[^>]*>(.*?)<\/a>.*$/, "$1");
  this.date = properties.date;
  this.date_str = this.date.toLocaleString();
  this.status = this.getStatus();
  this.buildRow().setStyle(this.status);
}

Thread.prototype.setStatus = function(status) {
  if(status == "read" || status == "spam")
    GM_setValue("thread_list", this._readlist(true) + "/" + this._identifier(status == "read" ? 3 : 2));
  else if(status == "unread")
    GM_setValue("thread_list", this._readlist(true));
  this.status = status;
  this.setStyle(status);
  return this;
}

Thread.prototype.setStyle = function(status) {
  var background, opacity, img_tip = "Spam thread", spam_button = "http://cdn.last.fm/flatness/global/icon_delete.2.png";
  switch(status) {
    case "read":
      background = "url(http://cdn.last.fm/flatness/icons/activity/2/created.png) left center no-repeat";
      opacity = 0.4;
    break;
    case "unread":
      background = "url(http://cdn.last.fm/flatness/icons/activity/2/recommended.png) left center no-repeat";
      opacity = 1;
    break;
    case "spam":
      background = "url(http://cdn.last.fm/flatness/icons/activity/2/disconnected.png) left center no-repeat";
      opacity = 0.4;
      img_tip = "Don't spam thread";
      spam_button = "http://cdn.last.fm/flatness/messageboxes/success.png";
    break;
  }
  
  this.elements.row.style.background = background;
  this.elements.row.style.opacity = opacity;
  this.elements.spam.alt = img_tip;
  this.elements.spam.title = img_tip;
  this.elements.spam.src = spam_button;
  return this;
}

Thread.prototype.getStatus = function() {
  var list = this._readlist();
  if(list.match(new RegExp("/" + this._identifier() + "(/|$)")))
    return "read";
  else if(list.match(new RegExp("/" + this._identifier(2) + "(/|$)")))
    return "spam";
  else
    return "unread";
}

Thread.prototype._readlist = function(clean) {
  var list = GM_getValue("thread_list", "");
  if(clean) return list.replace(new RegExp("/" + this._identifier(2) + ".*?(/|$)", "g"), "$1");
  else return list;
}

Thread.prototype._identifier = function(depth) {
  if(!depth) var depth = 3;
  return new Array(this.forum_id, this.id, this.last_post_id).slice(0, depth).join("%");
}

Thread.prototype.buildRow = function() {
  this.elements.row = document.createElement("li");
  this.elements.row.style.background = "none";
  this.elements.row.style.paddingLeft = "30px";
  this.elements.row.addEventListener("mouseover", (function(klass) {
    return function() {
      klass.elements.spam.style.visibility = "visible";
    }
  })(this), false);
  this.elements.row.addEventListener("mouseout", (function(klass) {
    return function() {
      klass.elements.spam.style.visibility = "hidden";
    }
  })(this), false);
  
  this.elements.spam = document.createElement("img");
  this.elements.spam.style.cssFloat = "right";
  this.elements.spam.style.cursor = "pointer";
  this.elements.spam.style.visibility = "hidden";
  this.elements.spam.addEventListener("click", (function(klass) {
    return function() {
      klass.setStatus.apply(klass, [(klass.status == "spam" ? "unread" : "spam")]);
    }
  })(this), false);
  this.elements.row.appendChild(this.elements.spam);
  
  this.elements.link = document.createElement("a");
  this.elements.link.href = this.url;
  this.elements.link.innerHTML = this.title_short;
  this.elements.link.addEventListener("mouseup", (function(klass) {
    return function() {
      klass.setStatus.apply(klass, ["read"]);
    }
  })(this), false);
  this.elements.row.appendChild(this.elements.link);
  
  this.elements.date = document.createElement("span");
  this.elements.date.className = "date";
  if(this.options.show_date == "yes") {
    this.elements.row.appendChild(document.createElement("br"));
    this.elements.date.innerHTML = this.date_str;
  }
  if(this.options.show_user == "yes")  this.elements.date.innerHTML += ' from <a href="/user/' + this.user + '">' + this.user + '</a>';
  this.elements.row.appendChild(this.elements.date);
  
  return this;
}