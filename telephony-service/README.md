# Telephony Service - FreeSWITCH Integration

## Running

```bash
cd telephony-service
npm install
node index.js
```

## API Endpoints

### POST /start-call
Start an outbound call

### GET /call/:callId
Get call status

### POST /end-call
End an active call

## FreeSWITCH Setup

1. Install FreeSWITCH or use Docker:
```bash
docker run -d --name freeswitch -p 5060:5060 -p 5061:5061 -e FS_PASSWORD=password voxcollect/freeswitch
```

2. Configure ESL in FreeSWITCH

## Environment
```
FS_HOST=localhost
FS_PORT=8021
FS_PASSWORD=voxcollect
FS_CONTEXT=default
```