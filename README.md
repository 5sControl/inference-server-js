### Inference Server API для разработчика алгоритма

После запуска контейнера подключиться к сокет-серверу через {process.env.server_url}:9999, после чего оформляется подписка на входящее событие (”snapshot detected”)

От клиента сервер принимает событие “send report” в виде массива снепшотов (Snapshots[]).

Пример реализации сокет-клиента на JS (ссылка):

```js
const io = require('socket.io-client')

/* >-----------------------------------------------------------------------------------------------> **/
// subscription

    const socket = io(`${process.env.server_url}:9999`, {
        query: {
            camera_ip: process.env.camera_ip
        }
    })
    socket.on("connect", () => console.log(`Your algorithm is subscribed to the inference server`))
    socket.on("disconnect", () => console.log(`Your algorithm is unsubscribed to the inference server`))

/* <----------------------------------------------------------------------------------------------< **/
// get detected snapshot

    socket.on("snapshot detected", (snapshot) => console.log("get detected snapshot"))

/* >----------------------------------------------------------------------------------------------> **/
// send ready report

    const violation_proof = [snapshot, snapshot, snapshot, snapshot]
    socket.emit("send report", violation_proof, (response) => console.log(response.status))

/* ------------------------------------------------------------------------------------------------- **/
```