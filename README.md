# jquery.form-artisian
jQuery plugin form design/reload editor, rebuild form, save user data, display user data

Like Ninja Form, a simple and standalone version.

Please check branch with-radio, a version with radio group.
## i18n

On the Way

## Demo

Demo in folder zone51 

## Description

* Design: Design a form online with drag and sort,and generate JSON object to store form data with position
* Build: Use designed JSON data to build a form to receive user data, and save user data and form structure in a new JSON object
* Display: Display user data with form structure
* Sketch: Load a JSON data generated by Design and ready to edit and update


## Usage

### Design
```js
$('.workspace').formArtisian('design',{
    panel: '#tool-panel',
    designSaveUrl: '/save_design_url', // Ajax post data to designSaveUrl
    designSaveCb: function (json,data) {
        //json your return
        //data form saved data
    }
});
```
or 
```js
$('.workspace').fart('design',{
    panel: '#tool-panel'
});
```

### Build

```js
$('.build-form').fart('build',{
    loadUrl: '/form/load',  //get JSON data generated by Design 
    saveUrl: '/form/save',  //location where user data post to 
    datepicker:true,
    saveUserDataCb: function (json,data) {
        //json: saveUrl response
        //data: user filled form and click submit, then collect user data
    }
});
```

### Display
```js
$('.display-form').fart('display',{
    loadUrl: '/form/user-data'
});
```

### Sketch
```js
$('.workspace').fart('sketch',{
    panel: '#tool-panel',
    loadUrl: '/form/load',
    designSaveUrl: '/save_design_url',
    designSaveCb: function (json,data) {

    }
});
```

### Mandatory requirements

* [jQuery](https://jquery.com/) v. 1.6+
* [Boostrap](https://v4-alpha.getbootstrap.com/) v.4-alpha
* [jQuery UI sortable draggable](https://api.jqueryui.com/) v. 1.9+
* [blueimp jQuery File Upload](https://github.com/blueimp/jQuery-File-Upload) v. 9.1+: Used to upload files
* [blueimp JavaScript Templates](https://github.com/blueimp/JavaScript-Templates) v. 3.5+: Used to load templates.


### Screenshot

#### Design Page
![Design](https://raw.githubusercontent.com/libos/jquery.form-artisian/master/zone51/design.jpg)

#### Build Page
![Build](https://raw.githubusercontent.com/libos/jquery.form-artisian/master/zone51/build.jpg)

#### Display Page
![Display](https://raw.githubusercontent.com/libos/jquery.form-artisian/master/zone51/display.jpg)



## License
Released under the [MIT license](https://opensource.org/licenses/MIT).

