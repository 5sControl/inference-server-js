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

function is_working_time() {

    function convert_time_to_minutes(time) {
        const [, hh, mm] = time.match(/(\d{2}):(\d{2})/)
        const minutes = parseInt(hh, 10) * 60 + parseInt(mm, 10)
        return minutes
    }

    const start_work_day = convert_time_to_minutes('14:00')
    const finish_work_day = convert_time_to_minutes('15:00')

    const date = new Date()
    const hour = (date.getHours() < 10 ? '0' : '' ) + date.getHours().toString()
    const min = (date.getMinutes() < 10 ? '0' : '' ) + date.getMinutes().toString()
    const current_time = convert_time_to_minutes(`${hour}:${min}`)

    return current_time > start_work_day && current_time < finish_work_day
}

module.exports = { djangoDate, is_working_time }