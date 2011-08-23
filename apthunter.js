Array.prototype.unique = function(){
    var o = {}, i, l = this.length, r = [];
    for(i=0; i<l;i+=1) o[this[i]] = this[i];
    for(i in o) r.push(o[i]);
    return r;
}

var CL = {
  isIgnored: function(result){
    return (store.get('ignored') || []).indexOf(this.resultToId(result)) > -1
  },
  isStarred: function(result){
    return (store.get('starred') || []).indexOf(this.resultToId(result)) > -1
  },
  saveResult: function(result, is_ignored, is_starred){
    var result_id = this.resultToId(result)

    var ignored = (store.get('ignored') || []).unique()
    if (is_ignored) {
      ignored.push(result_id)
      store.set('ignored', ignored)
    } else if (ignored.indexOf(result_id) > -1) {
      delete ignored[ ignored.indexOf(result_id) ]
      store.set('ignored', ignored)
    }

    var starred = (store.get('starred') || []).unique()
    if (is_starred) {
      starred.push(this.resultToId(result))
      store.set('starred', starred)
    } else if (starred.indexOf(result_id) > -1) {
      delete starred[ starred.indexOf(result_id) ]
      store.set('starred', starred)
    }
  },
  saveCurrentResult: function(result){
    store.set('current', this.resultToId(result))
  },
  getCurrentResult: function(){
    var curr = store.get('current')
    if (curr) {
      var link = $('p a[href*="'+store.get('current')+'.html"]')
      return link.length ? link.parent('p') : null
    } else
      return null
  },
  getTagsForResult: function(result){
    var tagStore = store.get('tags') || {}
    return tagStore[this.resultToId(result)]
  },
  setTagsForResult: function(result, tags){
    var tagStore = store.get('tags') || {}
    tagStore[this.resultToId(result)] = tags
    store.set('tags', tagStore)
  },
  addToCache: function(id, details){
    var cacheStore = store.get('cache') || {}
    cacheStore[id] = details
    store.set('cache', cacheStore)
  },
  getFromCache: function(id){
    return (store.get('cache') || {})[id]
  },
  getDetailsForResult: function(result, cb){
    var entry = this.getFromCache(this.resultToId(result))
    if (entry) {
      cb(entry)
    } else {
      var iframe = $('<iframe style="display:none">')
      var self = this
      iframe.attr('src', result.find('a').attr('href'))
      iframe[0].onload = function(){
        setTimeout(function(){
          entry = self.getFromCache(self.resultToId(result))
          cb(entry)
          iframe.remove()
        }, 600) // wait for content script in iframe to fire
      }
      iframe.appendTo('body')
    }
  },
  resultToId: function(result){
    if (typeof result == 'number' || typeof result == 'string')
      return result
    else {
      var link = result.find('a'), url
      if (link.length)
        url = link.attr('href')
      else
        url = document.location.pathname
      return url.match(/\/(\d+)\.html$/)[1]
    }
  }
}

var UI = {
  annotateResult: function(result){
    var tagStore = store.get('tags') || {}

    var tags = result.find('.tags')
    if (!tags.length) tags = $('<span class="tags">').appendTo(result)
    tags.text( tagStore[CL.resultToId(result)] )

    if (CL.isIgnored(result)) {
      result.addClass('ignored')
    } else if (CL.isStarred(result)) {
      result.addClass('starred')
    }
  },
  toggleInfoForResult: function(result, type, cb){
    var result_id = CL.resultToId(result),
        container_id = 'info-' + result_id + '-' + type

    var container = $('#'+container_id)
    if (container.length) {
      $('#spinner_'+container_id).remove()
      container.slideUp('fast', function(){
        container.remove()
      })

    } else {
      var container = $('<div id="'+container_id+'" class="'+type+'" style="display:none">')
      var spinner = $('<div id="spinner_'+container_id+'" class="spinner"><div class="bar1"></div><div class="bar2"></div><div class="bar3"></div><div class="bar4"></div><div class="bar5"></div><div class="bar6"></div><div class="bar7"></div><div class="bar8"></div><div class="bar9"></div><div class="bar10"></div><div class="bar11"></div><div class="bar12"></div></div>')

      currentResult.append(spinner)
      currentResult.append(container)

      CL.getDetailsForResult(currentResult, function(details){
        spinner.remove()
        cb(container, details)
        container.slideDown('fast')
      })
    }
  }
}

// on apartment detail pages
if (document.location.pathname.match(/apa\/\d+\.html$/)) {

  var result_id = document.location.pathname.match(/apa\/(\d+)\.html/)[1]

  var mailto = $('a[href*="mailto"]'),
      maps = $('a:contains("google map")'),
      srcs = $('img').map(function(){ return this.src }),
      images = $.makeArray(srcs).unique()

  var details = {
    title: $('h2').text(),
    email: mailto.length ? mailto[0].href : null,
    address: maps.length ? decodeURIComponent(maps[0].href.match(/q=(.*)$/)[1]) : null,
    images: images
  }

  CL.addToCache(result_id, details)
  UI.annotateResult($('h2'))

  var hotkeys = {
    // edit tags
    't': function(){
      var oldTags = CL.getTagsForResult(result_id)
      var tags = prompt('Enter comma separated tags: ', oldTags)
      CL.setTagsForResult(result_id, tags)
      UI.annotateResult($('h2'))
    },
    // ignore
    'i': function(){
      var currentResult = $('h2')
      currentResult.removeClass('starred')
      currentResult.toggleClass('ignored')
      CL.saveResult(currentResult, currentResult.hasClass('ignored'), currentResult.hasClass('starred'))
      UI.annotateResult(currentResult)
    },
    // star
    's': function(){
      var currentResult = $('h2')
      currentResult.removeClass('ignored')
      currentResult.toggleClass('starred')
      CL.saveResult(currentResult, currentResult.hasClass('ignored'), currentResult.hasClass('starred'))
      UI.annotateResult(currentResult)
    },
    // maps
    'm': function(){
      if ($('#inline_maps').length) {
        $('#inline_maps').remove()
        return
      }

      if (details.address) {
        var addr = details.address
        var container = $('<div id="inline_maps">').appendTo('#userbody small:last')
        var zoomLevels = [11, 15]
        zoomLevels.forEach(function(zoom){
          var src = 'http://maps.google.com/maps/api/staticmap?size=350x100&sensor=false&markers=color:red|' + addr + '&center=' + addr + '&zoom=' + zoom;
          container.append('<img src="'+src+'">')
        })
      }
    },
    // go back
    'left': function(){
      window.history.back()
    }
  }
  hotkeys['o'] = hotkeys['left']
  hotkeys['h'] = hotkeys['left']
  $.hotkeys(hotkeys)

}

// on apartment search result or listing pages
if (document.location.pathname.match(/(search\/apa\/|\/apa\/$)/)) {

  // find results
  var results = $('h4.ban ~ p')
  console.log(results.length + ' results')

  // highlight current result
  var currentResult = null
  var updateCurrentResult = function(result){
    // make new result current
    if (currentResult) currentResult.removeClass('current')
    currentResult = result
    currentResult.addClass('current')
    CL.saveCurrentResult(currentResult)

    // scroll into view
    var win = $(window),
        winHeight = win.height(),
        padding = winHeight / 10,
        top = currentResult.offset().top - padding,
        bottom = currentResult.offset().top + currentResult.outerHeight() + padding

    if (top < win.scrollTop()) {
      if (win.scrollTop() > padding)
        win.scrollTop( top )

    } else if (bottom > win.scrollTop() + winHeight) {
      win.scrollTop( bottom - winHeight )
    }
  }

  // bootstrap
  updateCurrentResult(CL.getCurrentResult() || results.eq(0))

  // setup keyboard nav
  var hotkeys = {
    // move down
    'j': function(){
      var next = currentResult.nextAll('p:first')
      if (next.length)
        updateCurrentResult(next)
      return false
    },
    // move up
    'k': function(){
      var prev = currentResult.prevAll('p:first')
      if (prev.length)
        updateCurrentResult(prev)
      return false
    },
    // ignore
    'i': function(){
      currentResult.removeClass('starred')
      currentResult.toggleClass('ignored')
      CL.saveResult(currentResult, currentResult.hasClass('ignored'), currentResult.hasClass('starred'))
    },
    // star
    's': function(){
      currentResult.removeClass('ignored')
      currentResult.toggleClass('starred')
      CL.saveResult(currentResult, currentResult.hasClass('ignored'), currentResult.hasClass('starred'))
    },
    // open
    'o': function(){
      window.location = currentResult.find('a').attr('href')
    },
    // edit tags
    't': function(){
      var oldTags = CL.getTagsForResult(currentResult)
      var tags = prompt('Enter comma separated tags: ', oldTags)
      CL.setTagsForResult(currentResult, tags)
      UI.annotateResult(currentResult)
    },
    // photos
    'p': function(){
      UI.toggleInfoForResult(currentResult, 'images', function(container, details){
        if (!details || !details.images || !details.images.length) {
          container.text('No images')
        } else {
          var images = details.images || []
          images.forEach(function(src){
            var img = $('<img>')
            img.appendTo(container)

            // remove small/broken images
            img.load(function(){
              w = img.width(),
              h = img.height()

              if (w+h && (w < 120 || h < 120 || w/h > 1.8 || h/w > 1.8)) {
                img.remove()
              }
            })
            img.error(function(){
              img.remove()
            })
            img.attr('src', src)
          })
        }
      })
    },
    // maps
    'm': function(){
      UI.toggleInfoForResult(currentResult, 'maps', function(container, details){
        if (!details || !details.address) {
          container.text('No maps')
        } else {
          var addr = details.address
          var zoomLevels = [11, 15]
          zoomLevels.forEach(function(zoom){
            var src = 'http://maps.google.com/maps/api/staticmap?size=350x100&sensor=false&markers=color:red|' + addr + '&center=' + addr + '&zoom=' + zoom;
            container.append('<img src="'+src+'">')
          })
        }
      })
    },
    // clear cache
    'c': function(){
      localStorage.removeItem('cache')
      alert('cache cleared!')
    }
  }
  hotkeys['up'] = hotkeys['k']
  hotkeys['down'] = hotkeys['j']
  hotkeys['right'] = hotkeys['o']
  hotkeys['l'] = hotkeys['right']
  $.hotkeys(hotkeys)

  // annotate results using saved data
  results.each(function(){
    var result = $(this)
    UI.annotateResult(result)
  })

  // clicking a result selects it
  $('p').click(function(){
    updateCurrentResult($(this))
  })
}
