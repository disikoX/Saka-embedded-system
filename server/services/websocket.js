
const rootHandler = (ws, req) => {
    ws.on('message', (msg) => {
        console.log(`Message reçu : ${msg}`);
        ws.send(`Echo : ${msg}`);
    });
};

export {
    rootHandler
}