var CLResults = {
  isIgnored: function(result){
    return (store.get('ignored') || []).indexOf(this.resultToId(result)) > -1
  },
  isStarred: function(result){
    return (store.get('starred') || []).indexOf(this.resultToId(result)) > -1
  },
  saveResult: function(result){
    if (result.hasClass('ignored')) {
      var ignored = (store.get('ignored') || [])
      ignored.push(this.resultToId(result))
      store.set('ignored', ignored)
    } else if (result.hasClass('starred')) {
      var starred = (store.get('starred') || [])
      starred.push(this.resultToId(result))
      store.set('starred', starred)
    }
  },
  resultToId: function(result){
    return result.find('a').attr('href').match(/(\d+)\.html$/)[1]
  }
}

// on apartment search result pages
if (document.location.pathname.match(/search\/apa\//)) {

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
  updateCurrentResult(results.eq(0))

  // setup keyboard nav
  $.hotkeys({
    'j': function(){
      var next = currentResult.next('p')
      if (next.length)
        updateCurrentResult(next)
    },
    'k': function(){
      var prev = currentResult.prev('p')
      if (prev.length)
        updateCurrentResult(prev)
    },
    'i': function(){
      currentResult.removeClass('starred')
      currentResult.toggleClass('ignored')
      CLResults.saveResult(currentResult)
    },
    's': function(){
      currentResult.removeClass('ignored')
      currentResult.toggleClass('starred')
      CLResults.saveResult(currentResult)
    }
  })

  // annotate results
  results.each(function(){
    var result = $(this)

    if (CLResults.isIgnored(result)) {
      result.addClass('ignored')
    } else if (CLResults.isStarred(result)) {
      result.addClass('starred')
    }
  })

}
