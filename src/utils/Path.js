// -------------- Paths and dirs
const {mkdirSync, existsSync} = require('fs')

function checkDirs(dirs) {
    try {
        for (const dir of dirs) {
            if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
        }
        return true
    } catch (error) {
        return error
    }
}

module.exports = { checkDirs }