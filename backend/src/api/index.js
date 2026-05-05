const app = require('./app')
const config = require('./config')

app.listen(config.PORT, () => {
    console.log("launching app at port: ", config.PORT)
})