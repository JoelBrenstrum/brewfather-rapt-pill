import { Issuer } from 'openid-client';
import 'dotenv/config'
import fetch from 'node-fetch';
import * as dayjs from 'dayjs';
import { BrewfatherCustomSteamPayload, GetHydrometersResult } from './types';

const identityUrl = "https://id.rapt.io/.well-known/openid-configuration";
const clientId = "rapt-user";
const clientSecret = process.env.API_KEY;
const clientUsername = process.env.EMAIL;
const brewfatherUrl = process.env.BREWFATHER_URL;

async function getAccessToken() {

    var issuer = await Issuer.discover(identityUrl);

    const client = new issuer.Client({
        client_id: clientId,
        client_secret: clientSecret
    });

    const grantResponse = await client.grant({
        grant_type: 'password',
        username: clientUsername,
        password: clientSecret
    });

    const accessToken = grantResponse.access_token
    return accessToken
}
let timeout;
let intervalPointer;
const intervalMinutes = 15
const intervalMs = intervalMinutes * 60 * 1000; //15 minutes
const dateFormat = "DD-MMM-YYYY hh:mm:ss a";
const round = (value: number, decimalPlaces = 2): number  => {
    const decimals = 10 ** decimalPlaces;
    return +(Math.round(+(value * decimals).toFixed(2)) / decimals).toFixed(decimalPlaces);
}

const dataPost = async () => {
    try {
        clearTimeout(timeout);

        //authenticate
        const bearerToken = await getAccessToken();
        console.log('bearerToken', bearerToken)

        //get all hydrometers
        const req = await fetch('https://api.rapt.io/api/Hydrometers/GetHydrometers', { headers: { authorization: `Bearer ${bearerToken}` } })
        console.log(req.status)
        if (req.status != 200) {
            console.log(await req.text())
            return;
        }
        const res = await req.json() as GetHydrometersResult;
        console.log(`Posting result to brewfather @ ${dayjs().format(dateFormat)}`)
        //post all hydrometers to brewfather
        await Promise.allSettled(res.map(async (hydrometer) => {
            const payload: BrewfatherCustomSteamPayload = {
                name: `${hydrometer.name}`,
                temp: round(hydrometer.temperature),
                gravity: (round(hydrometer.gravity ?? 0, 0)) / 1000,
                battery: hydrometer.battery,
                comment: `Signal Strength: ${hydrometer.rssi}dB; Battery: ${hydrometer.battery}%; Last Reading: ${dayjs(hydrometer.lastActivityTime).format(dateFormat)}`
            } 
            const body = new URLSearchParams(payload as any)
            console.log('payload', payload);
            const req = await fetch(brewfatherUrl, {
                body,
                method: 'POST',
            })
            const res = await req.json()
            console.log('brewfather post', res);
            if (res.result == "ignored") {
                timeout = setTimeout(dataPost, 60000);
            }
        }));

    } catch (ex) {
        console.error(ex)
        clearInterval(intervalPointer);
        throw ex;
    }
    if(timeout){
        console.log(`Failed to send, sending again in 1 minute...`)
    } else {
        console.log(`Waiting to send ${intervalMinutes} minutes to send again...`)
    }
}

(async () => {
    console.log('###########')
    console.log('clientSecret', clientSecret)
    console.log('clientUsername', clientUsername)
    console.log('brewfatherUrl', brewfatherUrl)
    console.log('###########')

    dataPost();
    intervalPointer = setInterval(dataPost, intervalMs);
})();

process.on("exit", () => {
    clearInterval(intervalPointer);
});