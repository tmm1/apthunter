# apthunter

a greasemonkey-style chrome extension for craigslist.org

adds keyboard bindings to:

* navigate results (up/down/left/right or h/j/k/l)
* highlight/ignore results
* add notes/tags to results
* show images/maps inline

originally developed for apartment listings, but works on any craigslist list/search or detail page.

## before

![](http://f.cl.ly/items/3U2d0V1R2D1J3f0e0A2J/Screen%20shot%202011-08-21%20at%201.25.07%20AM.png)

## after

![](http://f.cl.ly/items/350j0z3W40033U3l0U0B/Screen%20shot%202011-08-21%20at%201.12.22%20AM.png)

## installation

* `git clone git://github.com/tmm1/apthunter`
* navigate to [`chrome://extensions`](chrome://extensions/)
* click `Developer mode`
* click `Load unpacked extension...`
* navigate to your checkout and click `Select`
* go to [a craigslist listing page](http://sfbay.craigslist.org/sfc/apa/)
* hit `?`

## keyboard bindings

* `?` for help

### on a search results page

* `k` or `up` to select previous result
* `j` or `down` to select next result
* `l` or `right` to navigate to result page
* `i` to ignore current result (reduce opacity)
* `s` to star the current result (bgcolor highlight)
* `m` to toggle inline google map for location
* `p` to toggle inline photos
* `t` to edit tags/notes for result
* `c` to clear the inline cache

### on an apt detail page

* `h` or `left` to go back to the search results
* `i` to ignore result
* `s` to star the result
* `m` to toggle google maps
* `t` to edit tags/notes

## padmapper?

yes, i know about padmapper. it's a great service. [use it](http://padmapper.com).
