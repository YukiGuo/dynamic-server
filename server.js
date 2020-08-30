let http = require('http')
let fs = require('fs')
let url = require('url')
let  port = process.argv[2]

if (!port) {
    console.log('请指定端口号？\nnode server.js 8888 这样不会吗？')
    process.exit(1)
}

let server = http.createServer(function (request, response) {
    let parsedUrl = url.parse(request.url, true)
    let pathWithQuery = request.url
    let queryString = ''
    if (pathWithQuery.indexOf('?') >= 0) { queryString = pathWithQuery.substring(pathWithQuery.indexOf('?')) }
    let path = parsedUrl.pathname
    let query = parsedUrl.query
    let method = request.method

    /******** 从这里开始看，上面不要看 ************/

    console.log('有请求发过来啦！路径（带查询参数）为：' + pathWithQuery)
    const session = JSON.parse(fs.readFileSync('./session.json').toString())
    if (path === '/home.html') {
        const cookie = request.headers["cookie"]
        const homeContent = fs.readFileSync('./public/home.html').toString()
        let string, sessionId
        try {
            sessionId = cookie.split(";").filter(item => item.indexOf("sessionId=") >= 0).toString().split("=")[1]
        }
        catch (error) { }
        if (sessionId && session[sessionId]) {
            const userId = session[sessionId].userId
            const userArray = JSON.parse(fs.readFileSync("./db/users.json"));
            const user = userArray.find(user => user.id === userId);
            console.log(user)
            string = homeContent.replace("请登录", "已登录").replace("{{username}}", user.name)
        } else {
            string = homeContent.replace("{{logStatus}}", "请登录").replace("{{username}}", "")
        }
        response.write(string)
        response.end()
    }
    else if (path === '/signin' && method === "POST") {
        response.setHeader('Content-Type', `text/html;charset=utf-8`)
        console.log('ajax')
        const usersArray = JSON.parse(fs.readFileSync("./db/users.json"))
        const usersLength = usersArray.length
        const array = []
        request.on('data', (chunk) => {
            array.push(chunk)
        })
        request.on("end", () => {
            const string = Buffer.concat(array).toString()
            const obj = JSON.parse(string)
            const found = usersArray.find(element => element.name === obj.name && element.password === obj.password)
            if (found === undefined) {
                response.statusCode = 400
                response.end()
            } else {
                response.statusCode = 200
                const random = Math.random()
                session[random] = { "userId": found.id }
                fs.writeFileSync("./session.json", JSON.stringify(session))
                    / response.setHeader('Set-Cookie', `sessionId=${random}`)
                response.end("登录成功")
            }
        })
    }
    else if (path === '/signup' && method === "POST") {
        response.setHeader('Content-Type', `text / html; charset = utf - 8`)
        const usersArray = JSON.parse(fs.readFileSync("./db/users.json"))
        const usersLength = usersArray.length
        const array = []
        request.on('data', (chunk) => {
            array.push(chunk)
        })
        request.on("end", () => {
            const string = Buffer.concat(array).toString()
            const obj = JSON.parse(string)
            const newId = usersLength > 0 ? usersArray[usersLength - 1].id + 1 : 1
            const newUser = {
                id: newId,
                name: obj.name,
                password: obj.password
            }
            usersArray.push(newUser)
            fs.writeFileSync("./db/users.json", JSON.stringify(usersArray))
            response.end()
        }
        )
    }
    else {
        response.statusCode = 200
        let content
        const obj = {
            '.html': 'text/html',
            '.xml': 'text/xml',
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.png': 'image/png',
            '.jpg': 'image/jpeg'
        }
        let suffix = path.substr(path.indexOf('.'))
        fileType = obj[suffix] || 'text/html'

        const filePath = path === '/' ? '/home.html' : path
        try {
            content = fs.readFileSync(`./public${filePath}`)
        }
        catch (error) {
            content = '文件不存在'
            response.statusCode = 404
        }

        response.setHeader('Content-Type', `${fileType};charset=utf-8`)
        response.write(content)
        response.end()
    }
    /******** 代码结束，下面不要看 ************/
})

server.listen(port)
console.log('监听 ' + port + ' 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:' + port)