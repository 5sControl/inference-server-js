# Inference server JS for Machine control JS algorithm

# About Machine control JS
Machine control is one of the Official [5controlS](https://5controls.com/) algorithm.

Designed to handle complex industrial processes with ease, this innovative tool is perfect for use with semi-automated equipment. With Machine Control you can optimize your industrial processes and keep your equipment running smoothly, saving you time and money.

![Machine-control](https://github.com/5sControl/5s-user-documentation/blob/main/assets/Machine-control.png)

## Key features

- monitors use of equipment;
- prevents downtime of valuable and expensive equipment.

**Plug-in Machine control to 5controlS platform to detect when your workers are absent!**

> Learn more about Machine control JS on the [5controlS website](https://5controls.com/solutions/machine-control).

# Inference Server API for algorithm developer
After starting the container, connect to the socket server via {process.env.server_url}:9999, after which a subscription is issued for an incoming event (”snapshot detected").

The server receives the “send report” event from the client in the form of an array of snapshots (Snapshots[]).

Example of implementing a socket client in JS:

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

# **Documentation**

[Documentation for Developers](https://github.com/5sControl/5s-dev-documentation/wiki)

[User Documentation](https://github.com/5sControl/Manufacturing-Automatization-Enterprise/wiki)

# **Contributing**
Thank you for considering contributing to 5controlS. We truly believe that we can build an outstanding product together!

We welcome a variety of ways to contribute. Read below to learn how you can take part in improving 5controlS.

## **Code of conduct**

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

## Code contributing

If you want to contribute, read  our [contributing guide](CONTRIBUTING.md) to learn about our development process and pull requests workflow.

We also have a list of [good first issues](https://github.com/5sControl/inference-server-js/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22) that will help you make your first step to beсoming a 5S contributor.

# **Project repositories**

**5controlS Platform:**
1. [5s-webserver](https://github.com/5sControl/5s-webserver)
2. [5s-backend](https://github.com/5sControl/5s-backend)
3. [5s-frontend](https://github.com/5sControl/5s-frontend)
4. [5s-algorithms-controller](https://github.com/5sControl/5s-algorithms-controller)
5. [5s-onvif](https://github.com/5sControl/5s-onvif)
6. [5s-onvif-finder](https://github.com/5sControl/5s-onvif-finder)
  
**Official Algorithms:**
1. [min-max](https://github.com/5sControl/min-max)
2. [idle-control](https://github.com/5sControl/idle-control)
3. [operation-control-js](https://github.com/5sControl/operation-control-js)
4. [machine-control](https://github.com/5sControl/machine-control)
5. [machine-control-js](https://github.com/5sControl/machine-control-js)

**Algorithms Servers:**
1. [inference-server-js](https://github.com/5sControl/inference-server-js) - the server for Machine control JS algorithm

# **License**
[AGPL-3.0](LICENSE)

> Machine control JS uses third party libraries that are distributed under their own terms (see [LICENSE-3RD-PARTY.md](https://github.com/5sControl/inference-server-js/blob/main/LICENSE-3RD-PARTY.md)).<br>

<br>
<div align="center">
  <a href="https://5controls.com/" style="text-decoration:none;">
    <img src="https://github.com/5sControl/Manufacturing-Automatization-Enterprise/blob/3bafa5805821a34e8b825df7cc78e00543fd7a58/assets/Property%201%3DVariant4.png" width="10%" alt="" /></a> 
  <img src="https://github.com/5sControl/5s-backend/assets/131950264/d48bcf5c-8aa6-42c4-a47d-5548ae23940d" width="3%" alt="" />
  <a href="https://github.com/5sControl" style="text-decoration:none;">
    <img src="https://github.com/5sControl/Manufacturing-Automatization-Enterprise/blob/3bafa5805821a34e8b825df7cc78e00543fd7a58/assets/github.png" width="4%" alt="" /></a>
  <img src="https://github.com/5sControl/5s-backend/assets/131950264/d48bcf5c-8aa6-42c4-a47d-5548ae23940d" width="3%" alt="" />
  <a href="https://www.youtube.com/@5scontrol" style="text-decoration:none;">
    <img src="https://github.com/5sControl/Manufacturing-Automatization-Enterprise/blob/ebf176c81fdb62d81b2555cb6228adc074f60be0/assets/youtube%20(1).png" width="5%" alt="" /></a>
</div>

