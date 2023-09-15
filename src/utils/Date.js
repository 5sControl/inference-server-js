function padTo2Digits(num) {
    return num.toString().padStart(2, '0')
}
function djangoDate(date) {
    return (
        [
            date.getFullYear(),
            padTo2Digits(date.getMonth() + 1),
            padTo2Digits(date.getDate()),
        ].join('-')
        + ' ' +
        [
            padTo2Digits(date.getHours()),
            padTo2Digits(date.getMinutes()),
            padTo2Digits(date.getSeconds())
        ].join(':')
        + '.' +
        date.getMilliseconds()

    )
}
function create_time_index() {
    const date = new Date()
    const y = padTo2Digits(date.getFullYear()).substring(2, 4)
    const m = padTo2Digits(date.getMonth() + 1)
    const d = padTo2Digits(date.getDate())
    const h = padTo2Digits(date.getHours())
    const mn = padTo2Digits(date.getMinutes())
    const s = padTo2Digits(date.getSeconds())
    return +`${y}${m}${d}${h}${mn}${s}`
}

module.exports = { djangoDate, create_time_index }