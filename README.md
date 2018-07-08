# 前言
打代码的总是想写一个自己的博客.但是越到后面越是不想维护.还不如把维护的交给其他人.自己不想去维护.
虽然功能少但是简单.
主要是自己最近学了Vue然后先想用script引入的方式做个小东西练练手.

## 基于Vue开发的简易的免服务器的博客
通过调用GitHub官方的API文档然后引入Vue做为数据的绑定做到不需要后台也能直接完成一个自己的博客.

# 安装方法
## fork到自己的仓库

## 进行配置
配置文件在assets的config.json当中直接修改即可
* repository_url 代表当前的仓库地址
* api_url 代表"https://api.github.com/repos/"+ /你的用户名/你的仓库名称
* blog_title 大标题.比如..恶搞大王的博客.
* blog_small_title 小标题.比如..自己的名言啊啥的.
```json
{
    "repository_url": "https://github.com/egdw/GitBlog",
    "api_url": "https://api.github.com/repos/egdw/GitBlog",
    "blog_title": "这是大标题",
    "blog_small_title":"这是小标题."
}
```

## 设置GitPage
进入仓库.选择->settings->GitHub Pages->输入你想要的地址->即可访问


# 使用方法
## 如何写博客
通过打开仓库目录下的pages目录.在里面输入文章就会自动的显示在页面上
## 命名规范
比如:\`这是我的标题\`这是我的描述\`.md.
通过这种形式区分标题和描述.注意是\`不是单引号.

# 界面
## 首页
![我的首页](https://github.com/egdw/temp_pic_upload/blob/master/QQ20180708-124654.png?raw=true)
!["文章详细页面"](https://github.com/egdw/temp_pic_upload/blob/master/QQ20180708-124715.png?raw=true)
