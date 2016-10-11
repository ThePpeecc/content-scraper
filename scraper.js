/*jshint esversion: 6*/

var Xray = require('x-ray');
var x = Xray();


var allTheData = [];


x('http://shirts4mike.com', 'a', [{link: '@href'}])(function(err, title) {

  var savedLink = '';
  title.forEach(elem => {
    if (elem.link.includes('shirts.php')) {
      savedLink = elem.link;
    }
  });
  x(savedLink, 'a', [{link: '@href'}])(function(error, search) {

    var shirts = [];

    search.forEach(elem => {
      if (elem.link.includes('shirt.php')) {
        shirts.push(elem.link);
      }
    });

    var numberOfShirts = shirts.length;
    shirts.forEach(elem => {
      x(elem, '#content', {imageUrl: '.shirt-picture img@src', price: '.price', title: '.shirt-picture img@alt'})(function(error, search) {
        numberOfShirts--;
        search.url = elem;
        allTheData.push(search);
        if(numberOfShirts === 0) {
          console.log(allTheData);
        }
      });
    });
  });
});
