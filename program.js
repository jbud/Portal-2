// Operation Codes:
var operations = {
    GET_ALL: 1,
    GET_SINGLE: 2,
    POST_STORY: 3,
    POST_COMMENT: 4,
    EDIT_STORY: 5,
    GET_SESSION: 6,
    LOGIN_USER: 7,
    KILL_SESSION: 8,
    DELETE_STORY: 9,
    ABOUT_PAGE_GET: 10,
    ABOUT_PAGE_POST: 11,
    GET_ALL_OFFSET: 12,
    OLDER_EXISTS: 13,
    SESS_COLOR: 14
};
var ANIMATION_LENGTH_DESTROYING = 250;
var ANIMATION_LENGTH_LOADING = 250;
var ANIMATION_LENGTH_STORIES = 750;
var WAIT_TIME_LOADING_FROM_DB = 2000;

var session;
var sessionInfo;
var instances = 0;
var offset = 0;
// General Functions.
function facebookdelayedstart() {
    setTimeout("fbstart()", 500);
}
function fbstart() {
    FB.XFBML.parse();
}
function fakerandom() {
    var d = new Date()
    var time = d.getTime();
    return Math.floor((Math.random() * time) / 1000);
}

function fetch(idata) {
    var r;
    $.ajax({
        dataType: "json",
        url: "worker.php",
        async: false,
        type: "POST",
        data: idata,
        success: function (data) { r = data }
    }).fail(function () {
        console.log("[FATAL ERROR]fetch(" + JSON.stringify(idata) + ") (ajax/json/async=no/post) failed")
    });
    return r;
}

function animateDown(id) {
    $(id).slideDown({ queue:false, duration: ANIMATION_LENGTH_STORIES });
}

function waitdestroy(callback) {
    destroy();
    setTimeout(callback, 500);
}

function commentapi(id) {
    var api = "https://graph.facebook.com/comments/?ids=http://beta.budzique.com/&#63;s=";
    var call = api + id;
    var commentss = 0;
    $.ajax({
        url: "https://graph.facebook.com/comments/?ids=http://beta.budzique.com/?s="+id,
        dataType: 'json',
        success: function (data) {
            var items = [];
            $.each(data, function (key, val) {
                items.push(val)
            });
            commentss = items[0].comments;
            console.log(items);
        }
    }).fail(function () { console.log("[FATAL ERROR]commentapi(" + id + ") (ajax/json/async=default) failed") });
    return commentss;
}
function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
        vars[key] = value;
    });
    return vars;
}

function getCookie(c_name) {
    var c_value = document.cookie;
    var c_start = c_value.indexOf(" " + c_name + "=");
    if (c_start == -1) {
        c_start = c_value.indexOf(c_name + "=");
    }
    if (c_start == -1) {
        c_value = null;
    }
    else {
        c_start = c_value.indexOf("=", c_start) + 1;
        var c_end = c_value.indexOf(";", c_start);
        if (c_end == -1) {
            c_end = c_value.length;
        }
        c_value = unescape(c_value.substring(c_start, c_end));
    }
    return c_value;
}
/**
resets an input from a default value (use this onclick)
*/
function resetbox(box, defaultvalue) {
    if (box.value == defaultvalue) {
        box.value = "";
    }
}
function htmlDecode(input) {
    var e = document.createElement('div');
    e.innerHTML = input;
    return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
}
function formatDate(date, fmt) {
    function pad(value) {
        return (value.toString().length < 2) ? '0' + value : value;
    }
    return fmt.replace(/%([a-zA-Z])/g, function (_, fmtCode) {
        switch (fmtCode) {
            case 'Y':
                return date.getUTCFullYear();
            case 'M':
                return pad(date.getUTCMonth() + 1);
            case 'd':
                return pad(date.getUTCDate());
            case 'H':
                return pad(date.getUTCHours());
            case 'm':
                return pad(date.getUTCMinutes());
            case 's':
                return pad(date.getUTCSeconds());
            default:
                throw new Error('Unsupported format code: ' + fmtCode);
        }
    });
}

/**
Destroys all "destroyable" elements (this is used for page transitions)
*/
function destroy() {
    for (name in CKEDITOR.instances) {
        CKEDITOR.instances[name].destroy(); // Destroy all instances of CKEDITOR to prevent any conflict.
    }
    $(".destroyable").each(function( index ) {
        $(this).animate({ "height": "0px", "min-height": "0px", "opacity": 0 }, ANIMATION_LENGTH_DESTROYING, function () {
            console.log("Deleting instance with ID: " + $(this).attr('id'));
            $(this).remove();
        });
    });
}
function decimalToHex(d) {
    if (d == 0) {
        return "00";
    }
    var hex = Number(d).toString(16);
    hex = "".substr(0, 6 - hex.length) + hex;
    return hex;
}
function color() {
    var valueR = $("#colorR").val();
    var valueG = $("#colorG").val();
    var valueB = $("#colorB").val();
    
    $("#r").html(decimalToHex(valueR));
    $("#g").html(decimalToHex(valueG));
    $("#b").html(decimalToHex(valueB));
    $(".content").css("background-color", "rgba(" + valueR + "," + valueG + "," + valueB + ",0.5)");
    $(".sidebar1").css("background-color", "rgba(" + valueR + "," + valueG + "," + valueB + ",0.5)");
    $(".sidebar2").css("background-color", "rgba(" + valueR + "," + valueG + "," + valueB + ",0.5)");
}
function saveColor() {
    var r = $("#colorR").val();
    var g = $("#colorG").val();
    var b = $("#colorB").val();
    var workerdata = fetch({
        op: operations.SESS_COLOR,
        r: r,
        g: g,
        b: b
    });
}
function cmize() {
    var d = $('#Customize').css('display');
    if (d == "none") {
        $('#Customize').css("height", "").css("opacity", "");
        animateDown("#Customize");
    } else {
        $("#Customize").animate({
            height: "0px",
            opacity: 0
        }, ANIMATION_LENGTH_DESTROYING, function () {
            $("#Customize").hide();
        });
    }
}
function checkSession() {
    var result;
    $(".killable").animate({ "height": "0px", "min-height": "0px", "opacity": 0 }, ANIMATION_LENGTH_DESTROYING, function () {
        $(this).remove();
    });
    var workerdata = fetch({ op: operations.GET_SESSION });
    var obj = workerdata;
    if (obj.success == false) {
        console.log("Failed to load data from server! Error Message:" + workerdata.data);
    }
    else {
        result = obj.data;
    }
    session = result.loggedin;
    sessionInfo = result;
    var i;
    if (session) {
        var user = sessionInfo.user.username;
        var flags = sessionInfo.user.flags;
        var postMode = "";
        i = fakerandom();
        if (flags >= 2)
            postMode = "<a href=\"#\" onclick=\"storypostmode()\">Post</a>";
        var r = 255;
        var g = 255;
        var b = 255;
        var data = getCookie("portal2SessionClr");
        if (data != false && data != null) {
            console.log(data);
            var table = JSON.parse(data);
            r = table.r;
            g = table.g;
            b = table.b;
        }
        $("#userPanel").append("<div id=\"InnerPanelSess_"+i+"\" class=\"killable\" style=\"display:none;\">" +
            "<p>Logged in as " + user + "</p>" +
            "<p>" + postMode + "</p>" +
            "<p><a href=\"#\" onclick=\"logout()\">logout</a></p>" +
            "<div id=\"Customize\" style=\"display:none\"><input type=\"range\" id=\"colorR\" name=\"colorR\" min=\"0\" max=\"255\" value=\""+r+"\" onchange=\"color()\"><span id=\"r\">ff</span>" +
            "<input type=\"range\" id=\"colorG\" name=\"colorG\" min=\"0\" max=\"255\" value=\""+g+"\" onchange=\"color()\"><span id=\"g\">ff</span>" +
            "<input type=\"range\" id=\"colorB\" name=\"colorB\" min=\"0\" max=\"255\" value=\""+b+"\" onchange=\"color()\"><span id=\"b\">ff</span>" +
            "<button onclick=\"saveColor();\">Save Color</button><span id=\"colr\">For this Session.</span></div>" +
            "<button onclick=\"cmize()\">Customize</button>"+
            "</div>"
        );
        animateDown("#InnerPanelSess_" + i + "");
        color();
        $("#usrLoad").hide(ANIMATION_LENGTH_LOADING);
    }
    else {
        i = fakerandom();
        $("#userPanel").append("<div id=\"InnerPanelDef_" + i + "\" class=\"killable\" style=\"display:none;\">" +
            "<p><a href=\"#\" onclick=\"login()\">Login</a></p>"+
            "<p><a href=\"#\" onclick=\"alert('Registration Not available...')\">Register</a></p>"+
        "</div>"
        );
        animateDown("#InnerPanelDef_" + i + "");
        $("#usrLoad").hide(ANIMATION_LENGTH_LOADING);
    }
}

function logout() {
    var workerdata = fetch({ op: operations.KILL_SESSION });
    init();
}

function login() {
    $(".killable").animate({ "height": "0px", "min-height": "0px", "opacity": 0 }, ANIMATION_LENGTH_DESTROYING, function () {
        $(this).remove();
    });
    var i = fakerandom();
    $("#userPanel").append("<div id=\"InnerPanelLogin_" + i + "\" class=\"killable\" style=\"display:none;\">" +
            "<p><input form=\"worker\" type=\"text\" name=\"username\" id=\"username\" value=\"username\" onclick='resetbox(this, \"username\")'/></p>" +
            "<p><input form=\"worker\" type=\"password\" name=\"password\" id=\"password\" value=\"password\" onclick='resetbox(this, \"password\")'/></p>" +
            "<p>Keep me logged in: <input form=\"worker\" type=\"checkbox\" name=\"long\" id=\"long\"/><button onclick=\"login1()\">Log In</button></p>"+
            "</div>"
        );
    animateDown("#InnerPanelLogin_" + i + "");
}
function login1() {
    var iuser = $("[name=username]").val();
    var ipass = $("[name=password]").val();
    var ilong = $("[name=long]").val();
    var workerdata = fetch({
        op: operations.LOGIN_USER,
        username: iuser,
        password: ipass,
        long: ilong
    });

    var obj = workerdata;
    if (obj.success == false) {
        //alert("Failed to load data from server! Error Message:" + JSON.stringify(obj.data));
        alert("Invalid username or password, please try again.");
    }
    checkSession();
}

// STORYPOSTMODE()

function storypostmode() {
    newsOn = false;
    destroy();
    var i = fakerandom();
    $("#article1").append("<section id=\"section_edit_" + i + "\" class=\"destroyable\" style=\"display:none;\">" +
        "<h2>Add new post</h2>" +
        "<input type='text' form='worker' id='title' name='title' value='title' onclick='resetbox(this, \"title\")'/>" +
        "<textarea rows='6' cols='50' id='editor"+instances+"' name='story' class='ckeditor' form='worker'></textarea>" +
        "<button onclick='poststory()'>Submit</button>" +
        "</section>"
    );
    animateDown("#section_edit_" + i + "");
    $("#section_edit_" + i + "").animate({ 'min-height': "200px" }, { duration: ANIMATION_LENGTH_STORIES });
    CKEDITOR.replaceAll('ckeditor');
    instances = instances + 1;
}
//################END STORYPOSTMODE()


function storyeditmode(id) {
    var workerdata = fetch({ op: operations.GET_SINGLE, story_id: id });
    newsOn = false;
    destroy();
    var obj = workerdata;
    if (obj.success == false) {
        alert("Failed to load data from server! Error Message:" + JSON.stringify(obj.data));
    }
    else {
        var data = obj.data;
    }
    var i = fakerandom();
    $("#article1").append("<section id=\"section_edit_" + i + "\" class=\"destroyable\" style=\"display:none;\">" +
        "<h2>Edit Post</h2>" +
        "<input type='text' form='worker' name='title' value='"+data.title+"' onclick='resetbox(this, \""+data.title+"\")'/>" +
        "<textarea rows='6' cols='50' id='editor" + instances + "' name='story' class='ckeditor' form='worker'>" + data.story + "</textarea>" +
        "<button onclick='editstory("+id+")'>Submit</button>" +
        "</section>"
    );
    animateDown("#section_edit_" + i + "");
    $("#section_edit_" + i + "").animate({ 'min-height': "200px" }, { duration: ANIMATION_LENGTH_STORIES });
    
    CKEDITOR.replaceAll('ckeditor');
    instances = instances + 1;
}
//################END STORYEDITMODE()
function editstory(id) {
    var istory = getEditorContent();
    var workerdata = fetch({
        op: operations.EDIT_STORY,
        estory_id: id,
        story: istory,
    });
    destroy();
    init();
}

function poststory() {
    var ititle = $("#title").val();
    var istory = getEditorContent();
    console.log(istory);
    var workerdata = fetch({
        op: operations.POST_STORY,
        author: sessionInfo.user.username,
        title: ititle,
        story: istory,
    });
    destroy();
    init();
}

function deletestory(id) {
    if (confirm("Are you sure you want to delete this story?")) {
        var workerdata = fetch({ op: operations.DELETE_STORY, dstory_id: id });
        init();
    }
    else {
        getstory(id);
    }
}
function getObjectLength(obj) {
    var length = 0;
    for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
            length++;
        }
    }
    return length;
}
function validemail(email) {
    var pattern = new RegExp(/^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i);
    return pattern.test(email);
}
/** 
This function needs to be improved.
Currently it accesses the first found instance of CKEDITOR. If there's an error
it could pull the wrong data.
*/
function getEditorContent() {
    var inst = CKEDITOR.instances;
    var data;
    if (getObjectLength(inst) == 1) {
        
        for (name in CKEDITOR.instances) {
            data = CKEDITOR.instances[name].getData();
        }
    }
    return data;
}
function abouteditmode() {
    var workerdata = fetch({ op: operations.ABOUT_PAGE_GET });
    newsOn = false;
    destroy();
    var obj = workerdata;
    if (obj.success == false) {
        alert("Failed to load data from server! Error Message:" + JSON.stringify(obj.data));
    }
    else {
        var data = obj.data;
    }
    var i = fakerandom();
    $("#article1").append("<section id=\"section_edit_" + i + "\" class=\"destroyable\" style=\"display:none;\">" +
        "<h2>Edit About Page</h2>" +        
        "<textarea rows='6' cols='50' id='editor" + instances + "' name='about' class='ckeditor' form='worker'>" + data.about + "</textarea>" +
        "<button onclick='editabout()'>Submit</button>" +
        "</section>"
    );
    animateDown("#section_edit_" + i + "");
    $("#section_edit_" + i + "").animate({ 'min-height': "200px" }, { duration: ANIMATION_LENGTH_STORIES });
    
    CKEDITOR.replaceAll('ckeditor');
    instances = instances + 1;
}
function editabout() {
    var iabout = getEditorContent();
    var workerdata = fetch({
        op: operations.ABOUT_PAGE_POST,
        about: iabout
    });
    //destroy();
    about();
}
// GETSTORY()
function titlechange(title) {
    var t = $("#function").html();
    if (t == title) {
        return 0;
    }
    else {
        $("#function").hide(250, function () {
            $(this).html(title, function () {

            })
        });
        $("#function").show(250);
    }
}
function contactus() {
    titlechange("Contact Us");
    newsOn = false;
    destroy();
    var i = fakerandom();
    $("#article1").append("<section id=\"section_edit_" + i + "\" class=\"destroyable\" style=\"display:none;\">" +
        "<h2>Contact Us</h2>" +
        "<input type=\"text\" name=\"fullname\" id=\"fullname\" />" +
        "<input type=\"email\" name=\"email\" id=\"email\" />" +
        "<textarea rows='6' cols='50' id='editor" + instances + "' name='mail' class='ckeditor' form='worker'></textarea>" +
        "<button onclick='contactus1()'>Submit</button>" +
        "</section>"
    );
    animateDown("#section_edit_" + i + "");
    $("#section_edit_" + i + "").animate({ 'min-height': "200px" }, { duration: ANIMATION_LENGTH_STORIES });
    
    CKEDITOR.replaceAll('ckeditor');
    instances = instances + 1;
}

function contactus1() {
    var email = $("#email").val();
    var fullname = $("#fullname").val();
    var mail = getEditorContent();
    var valid = true;
    if (!validemail(email)) {
        valid = false;
        alert("Please input a valid email address...");
    }
    else {
        if (fullname == "") {
            valid = false;
            alert("Please input your name...");
        }
    }
}

function about() {
    titlechange("About");
    newsOn = false;
    destroy();
    var workerdata = fetch({ op: operations.ABOUT_PAGE_GET });

    var obj = workerdata;
    if (obj.success == false) {
        console.log("Failed to load data from server! Error Message:" + JSON.stringify(obj.data));
    }
    else {
        var data = obj.data;
    }
    var i = fakerandom();
    var row;
    row = data.about;
    var editOptions = "&nbsp;";
    if (session && sessionInfo.user.flags > 2)
        editOptions = "<a href=\"#\" onclick=\"abouteditmode()\">edit</a>";

    
    $("#article1").append("<section id=\"section_" + i + "\" class=\"destroyable\" style=\"display:none;\">" + htmlDecode(row) + 
        "<div class=\"fb-comments\" data-href=\"http://beta.budzique.com/?s=about\" data-colorscheme=\"light\" data-numposts=\"5\" data-width=\"600px\"></div>" +
        "<p><span class=\"smallinfo2\" >" +
        editOptions +
        "</span></p>"+
        "</section>"
        );
    animateDown("#section_" + i);
    $("#section_"+i).animate({ 'min-height': "200px" }, { queue:false, duration: ANIMATION_LENGTH_STORIES });
    i++;
    facebookdelayedstart()
}

function getstory(id) {
    destroy();
    newsOn = false;
    var workerdata = fetch({ op: operations.GET_SINGLE, story_id: id });

    var obj = workerdata;
    if (obj.success == false) {
        alert("Failed to load data from server! Error Message:" + workerdata.data);
    }
    else {
        var data = obj.data;
    }
    var i = fakerandom();
    var row;
    row = data;
    var date = formatDate(new Date(row.date * 1000), '%M-%d %H:%m:%s');
    var editOptions = "&nbsp;";
    if (session && sessionInfo.user.flags > 1)
        editOptions = "<a href=\"#\" onclick=\"storyeditmode(" + row.id + ")\">edit</a>&nbsp;|&nbsp;<a href=\"#\" onclick=\"deletestory(" + row.id + ")\">delete</a>";

    $("#article1").append("<section id=\"section_" + i + "\" class=\"destroyable\" style=\"display:none;\"><h2><a title='permalink' href=\"http://beta.budzique.com/?s=" + row.id + "\" class=\"storyTitle\"><span class=\"title\">" +
        row.title +
        "</span></a><span class=\"smallinfo\">By " +
        row.author +
        " - " +
        date +
        "</span></h2>" +
        "<hr/><p>" +
        htmlDecode(row.story) +
        "</p>" +
        "<div class=\"fb-comments\" data-href=\"http://beta.budzique.com/?s="+row.id+"\" data-colorscheme=\"light\" data-numposts=\"5\" data-width=\"600px\"></div>" +
        "<p><span class=\"smallinfo2\" >" +
        editOptions +
        "</span></p></section>"

        
    );
    animateDown("#section_" + i);
    $("#section_" + i).animate({ 'min-height': "200px" }, { queue:false, duration: ANIMATION_LENGTH_STORIES });
    i--;
    history.pushState('', "Portal 2 - News", "?s="+row.id);
    facebookdelayedstart()
}
function boolOldExist() {
    var workerdata = fetch({ op: operations.OLDER_EXISTS, curr_offset: offset });

    var obj = workerdata;
    if (obj.success == false) {
        alert("Failed to load data from server! Error Message:" + JSON.stringify(obj.data));
        return -1;
    }
    else {
        var data = obj.data;
    }
    var offsettext = "";
    if (data == true) {
        return true;
    }
    return false;
}
function oldexist() {
    var workerdata = fetch({ op: operations.OLDER_EXISTS, curr_offset: offset });

    var obj = workerdata;
    if (obj.success == false) {
        alert("Failed to load data from server! Error Message:" + JSON.stringify(obj.data));
    }
    else {
        var data = obj.data;
    }
    var offsettext = "";
    if (data == true) {
        var o = offset + 3;
        offsettext += "<a href=\"#\" onclick=\"initOffset(" + o + ")\">Older Stories</a>";
    }
    
    if (offset > 0) {
        if (offsettext != "")
            offsettext += "&nbsp;|&nbsp;";

        var o = offset - 3;
        offsettext = offsettext + "<a href=\"#\" onclick=\"initOffset(" + o + ")\">Newer Stories</a>";
    }

    var i = fakerandom();
    app = "<section id=\"oldnew_" + i + "\" class=\"destroyable\" style=\"display:none;\">" + offsettext + "</section>";
    $("#article1").append(app);
    $("#oldnew_" + i + "").slideDown();
}
// INIT()\
var newsOn;
function init(storyid) {
    storyid = typeof storyid !== 'undefined' ? storyid : false;
    newsOn = true;
    checkSession();
    if (storyid != false) {
        getstory(storyid);
    }
    else {
        destroy();
        var workerdata = fetch({ op: operations.GET_ALL });
        init1("",workerdata);
    }
    offset = 0;
}
function initOffset(oset) {
    var offset = oset;
    destroy();
    var workerdata = fetch({ op: operations.GET_ALL_OFFSET, offset: oset });
    init1("",workerdata);
}
function getScrollBot() {
    o = offset + 3;

    var workerdata = fetch({ op: operations.GET_ALL_OFFSET, offset: o });
    var obj = workerdata;
    if (obj.success == false) {
        console.log("Failed to load data from server! Error Message:" + JSON.stringify(obj.data));
    }
    else {
        var data = obj.data;
    }
    var i = fakerandom();
    var row;
    for (x in data) {
        row = data[x]
        var date = formatDate(new Date(row.date * 1000), '%M-%d %H:%m:%s');
        var app = "<section id=\"section_" + i + "\" class=\"destroyable\" style=\"display:none;\"><h2><a href=\"#\" onclick=\"getstory(" + row.id + ")\" class=\"storyTitle\"><span class=\"title\">" +
            row.title +
            "</span></a><span class=\"smallinfo\">By " +
            row.author +
            " - " +
            date +
            "</span></h2>" +
            "<hr/><p>" +
            htmlDecode(row.summary) +
            "</p><p><span class=\"smallinfo2\" ><fb:comments-count href=\"http://beta.budzique.com/?s=" + row.id + "\"></fb:comments-count>" +
            " comment(s)</span></p></section>";
        $("#article1").append(app);
        animateDown("#section_" + i);
        $("#section_" + i).animate({ 'min-height': "200px" }, { queue: false, duration: ANIMATION_LENGTH_STORIES });
        i++;
    }

    offset = o;
    facebookdelayedstart();
}
function init1(message, workerdata) {
    message = typeof message !== 'undefined' ? message : "";
    

    var obj = workerdata;
    if (obj.success == false) {
        console.log("Failed to load data from server! Error Message:" + JSON.stringify(obj.data));
    }
    else {
        var data = obj.data;
    }
    var i = fakerandom();
    var row;
    titlechange("News");
    for (x in data) {
        row = data[x]
        var date = formatDate(new Date(row.date * 1000), '%M-%d %H:%m:%s');
        var app = "<section id=\"section_" + i + "\" class=\"destroyable\" style=\"display:none;\"><h2><a href=\"#\" onclick=\"getstory(" + row.id + ")\" class=\"storyTitle\"><span class=\"title\">" +
            row.title +
            "</span></a><span class=\"smallinfo\">By " +
            row.author +
            " - " +
            date +
            "</span></h2>" +
            "<hr/><p>" +
            htmlDecode(row.summary) +
            "</p><p><span class=\"smallinfo2\" ><fb:comments-count href=\"http://beta.budzique.com/?s="+row.id+"\"></fb:comments-count>" +
            " comment(s)</span></p></section>";
        $("#article1").append(app);
        animateDown("#section_" + i);
        $("#section_" + i).animate({ 'min-height': "200px" }, { queue:false, duration: ANIMATION_LENGTH_STORIES });
        i++;
    }
    history.pushState('', "Portal 2 - News", "/");
    //oldexist();
    facebookdelayedstart()
}
//################ END INIT()
function botInit() {
    ScrollBot = true;
}
function ToTop() {
    $('html, body').animate({
        scrollTop: 0
    }, 1500);
}
function destroyLoad() {
    $("#LoadOld").animate({ "height": "0px", "min-height": "0px", "opacity": 0 }, ANIMATION_LENGTH_DESTROYING, function () {
        console.log("Deleting instance with ID: " + $(this).attr('id'));
        $(this).remove();
    });
}
var ScrollBot = true;
$(document).ready(function () {
    var pvar = "";
    pvar = getUrlVars()["s"];
    if (pvar != "") {
        setTimeout("init("+pvar+");", 1500);
    }
    else {
        setTimeout("init();", 1500);
    }
    $(window).scroll(function () {
        if ($(window).scrollTop() + $(window).height() >= $(document).height() - 300) {
            //alert("bottom!");
            if (boolOldExist() && newsOn) {
                if (ScrollBot) {
                    app = "<section id=\"LoadOld\" class=\"destroyable\" style=\"display:none;\">Loading Older Posts...</section>";
                    $("#article1").append(app);
                    $("#LoadOld").slideDown();
                    setTimeout("destroyLoad()", 1000);
                    setTimeout("getScrollBot();", 500 + ANIMATION_LENGTH_DESTROYING);
                }
                ScrollBot = false;
                setTimeout("botInit();", 1000);
            }
        }
    });
});