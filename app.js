const WebSocket = require('ws');

let port = process.env.port || 3001;
const wss = new WebSocket.Server({ port: port });

const clients = new Map(); 

function getHighPrecisionTime() {
  const nowMs = Date.now(); // milliseconds since epoch (integer)
  const hrtime = process.hrtime(); // [seconds, nanoseconds]

  // convert hrtime to milliseconds (fractional)
  const hrtimeMs = hrtime[0] * 1000 + hrtime[1] / 1e6;

  // approximate process start time in ms
  const processStartTime = nowMs - hrtimeMs;

  // get high precision current time: process start + hrtime now
  return processStartTime + hrtimeMs;
}

wss.on('connection', (ws) => {
  const clientId = Date.now(); // Generate ID based on timestamp
  clients.set(clientId, ws);   
  
  

  ws.on('message', (message) => {
    try {
      console.log(`Received message from client ${clientId}: ${message}`); 
      
      let data = JSON.parse(message) 
      
      if ( data.type == 'DELAYREQUEST'){
          let delay_req_time = getHighPrecisionTime();
          ws.send(
            JSON.stringify(
              {
                id : clientId,
                type:"DELAYRESPONSE",
                delayReqSentAt : data.delayReqSentAt,
                delayReqRecievedAt :delay_req_time,
              }
            )
          )
      }else if ( data.type == 'VOLUME'){
        data['id'] = clientId,

        clients.forEach((client, id) => {
          if (client.readyState === WebSocket.OPEN && clientId != id ) {  
            client.send(JSON.stringify(data)); 
          }
        });
      }else{
        
        let nowTime = getHighPrecisionTime() + 700
        data['id'] = clientId,
        data["scheduledTime"] = nowTime
        
        clients.forEach((client, id) => {
          if (client.readyState === WebSocket.OPEN ) {  
            client.send(JSON.stringify(data)); 
          }
        });
      }
      
    } catch (error) {
      console.error('Error handling message:', error);
      ws.terminate();
    }
  });

  ws.on('close', () => {
    clients.delete(clientId);
    console.log(`Client ${clientId} disconnected`);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

console.log('WebSocket server listening on port 8080');
