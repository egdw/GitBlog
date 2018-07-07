var vm = new Vue({
    el: '#main',
    methods: {

    },
    data: {

    }
})


// 把markdown转换为html代码.通过使用showdown.js
function compileMarkDown() {
    //获取要转换的文字
    var text = document.getElementById("content").value;
    //创建实例
    var converter = new showdown.Converter();
    //进行转换
    var html = converter.makeHtml(text);
    //展示到对应的地方

}

$(document).ready(function () {

    // 获取配置文件的地址
    host = window.location.host;
    host2 = document.domain;
    url = window.location.href;

    console.log(host)
    console.log(host2)
    url = url.replace("/index.html", "/")
    if (url.length > 0) {
        if (url.charAt(url.length - 1) == '/') {
            // 如果后面有斜杠的话
            url = url + "assets/config.json";
        } else {
            url = url + "/assets/config.json";
        }
    }
    console.log(url)
    // $.ajax(2{
    //     type: "get",
    //     url: "url",
    //     data: "data",
    //     dataType: "dataType",
    //     success: function (response) {

    //     }
    // });
});