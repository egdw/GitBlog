// 当前项目的仓库地址
var currentRepositoryUrl;
// 当前项目的配置地址
var currentConfigUrl;
// 当前文章的地址
var currentPageUrl;
// 当前api的地址
var currentApiUrl;



Vue.component("nopicli", {
    template: '<li class="flow-list-li"><a><div class="summary"><h3 class="title">{{pagetitle}}</h3><p class="abstract">{{mydesc}}</p></div></a></li>',
    props: ['item'],
    data: function () {
        return {
            mytitle: '',
            mydesc: '',
        }
    },
    computed: {
        pagetitle: function () {
            console.log(this.item.name)
            temp = this.item.name.spilt("`")
            if (temp.length >= 1) {
                this.mytitle = temp[0]
                this.mydesc = temp[1]
            }else{
                this.mytitle = temp[0]
            }
            return this.mytitle
        },
    },

})

Vue.component("nopicli2", {
    template: '<li class="flow-list-li"><img class="wrap-img" src=""><a><div class="summary"><h3 class="title">{{title}}</h3><p class="abstract">{{desc}}</p></div></a></li>',
    props: ['title', 'desc', 'pic'],
    data: function () {

    }
})


var vm = new Vue({
    el: '#main',
    methods: {

    },
    data: {
        pages: []
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
    url = window.location.href;
    url = url.replace("/index.html", "/")
    if (url.length > 0) {
        if (url.charAt(url.length - 1) == '/') {
            // 如果后面有斜杠的话
            url = url + "assets/config.json";
        } else {
            url = url + "/assets/config.json";
        }
    }
    //获取到当前配置文件的路径
    this.currentConfigUrl = url;
    console.log(url)
    $.ajax({
        type: "get",
        url: url,
        dataType: "json",
        success: function (data, response) {
            //获取到当前项目的url地址
            this.currentRepositoryUrl = data.repository_url
            this.currentApiUrl = data.api_url
            //获取当前项目的文章地址
            this.currentPageUrl = this.currentApiUrl + "/contents/pages?ref=master"
            //进行ajax请求.获取相应的数据
            console.log(this.currentRepositoryUrl)
            console.log(this.currentPageUrl)
            //获取文章..
            $.ajax({
                type: "get",
                url: this.currentPageUrl,
                dataType: "json",
                success: function (data, response) {
                    console.log(data)
                    vm.pages = data;
                    // for (var i = 0; i < data.length; i++) {
                    //     console.log(data[i])
                    // }
                }
            });
        }
    });
});
