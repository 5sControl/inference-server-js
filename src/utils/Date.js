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


function is_working_time() {

    function convert_time_to_minutes(time) {
        const [, hh, mm] = time.match(/(\d{2}):(\d{2})/)
        const minutes = parseInt(hh, 10) * 60 + parseInt(mm, 10)
        return minutes
    }

    const start_work_day = convert_time_to_minutes('09:00')
    const finish_work_day = convert_time_to_minutes('10:00')

    const date = new Date()
    const hour = (date.getHours() < 10 ? '0' : '' ) + date.getHours().toString()
    const min = (date.getMinutes() < 10 ? '0' : '' ) + date.getMinutes().toString()
    const current_time = convert_time_to_minutes(`${hour}:${min}`)

    return current_time > start_work_day && current_time < finish_work_day
}

module.exports = { djangoDate, create_time_index, is_working_time }