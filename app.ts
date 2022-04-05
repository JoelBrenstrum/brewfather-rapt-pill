import { Issuer } from 'openid-client';
import 'dotenv/config'
import fetch from 'node-fetch';
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
let intervalPointer;

const dataPost = async () => {
    try {

        //authenticate
        const bearerToken = await getAccessToken();
        console.log('bearerToken', bearerToken)

        //get all hydrometers
        const req = await fetch('https://api.rapt.io/api/Hydrometers/GetHydrometers', { headers: { authorization: `Bearer ${bearerToken}` } })
        console.log(req.status)
        if(req.status != 200){
            console.log(await req.text())
            return;
        }
        const res = await req.json() as GetHydrometersResult;

        //post all hydrometers to brewfather
        await Promise.allSettled(res.map((hydrometer) => {
            const payload: BrewfatherCustomSteamPayload = {
                name: `${hydrometer.name} - ${hydrometer.id}`,
                temp: hydrometer.temperature,
                gravity: (hydrometer.gravity ?? 0) / 1000,
                battery: hydrometer.battery,
                comment: `Signal Strength: ${hydrometer.rssi}dB`
            };
            console.log('payload',payload );
            fetch(brewfatherUrl, {
                body: JSON.stringify(payload),
                method: 'POST',
            })
        }));



    } catch (ex) {
        console.error(ex)
        clearInterval(intervalPointer);
        throw ex;
    }
}

const intervalTime = 15 * 60 * 1000; //15 minutes
(async () => {
    console.log('###########')
    console.log('clientSecret', clientSecret)
    console.log('clientUsername', clientUsername)
    console.log('brewfatherUrl', brewfatherUrl)
    console.log('###########')

    dataPost();
    intervalPointer = setInterval(dataPost, intervalTime);
})();

process.on("exit", () => {
    clearInterval(intervalPointer);
});