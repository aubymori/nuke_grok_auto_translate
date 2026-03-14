import { ClientTransaction, getOndemandFileUrl } from "xclienttransaction";

const MODAL_HTML = `
<div id="ngat">
    <style>
        html {
            overflow: hidden !important;
        }

        #ngat {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(128, 128, 128, .5);
        }

        #ngat-dialog {
            max-width: 500px;
            margin: 0 auto;
            margin-top: 75px;
            padding: 10px;
            background: #000;
        }

        #ngat, #ngat *, #ngat button, #ngat textarea {
            font-family: Arial, Helvetica, sans-serif !important;
            font-size: 13px;
        }

        #ngat p {
            margin: 4px 0;
        }

        #ngat button, #ngat textarea {
            background: #2b2b2b;
            border: 1px solid #919191;
        }

        #ngat button {
            padding: 0 5px;
            cursor: default;
        }

        #ngat button[disabled] {
            opacity: .5;
        }

        #ngat button:hover:not([disabled]) {
            background: #535353;
            border-color: #b2b2b2;
        }

        #ngat button:hover:active:not([disabled]) {
            background: #5c5c5c;
            border-color: #d1d1d1;
        }

        #ngat-log {
            font-family: monospace;
            resize: none;
            box-sizing: border-box;
            width: 100%;
            height: 10em;
            line-height: 1.25;
        }

        #ngat-btns {
            text-align: right;
            margin-top: 4px;
        }
    </style>
    <div id="ngat-dialog">
        <b>Nuke Grok Auto-Translate</b> <span>v1.0.1</span>
        <p>
            Twitter now has auto-translate on by default, and only allows you disable
            it on a per-language basis by discovering Tweets in the language you wish
            to disable it in. This script will disable it for <i>all</i> known languages.
        </p>
        <span>Log:</span><br>
        <textarea id="ngat-log" readonly=""></textarea>
        <div id="ngat-btns">
            <button id="ngat-start">Do it!</button>
            <button id="ngat-close">Close</button>
        </div>
    </div>
</div>
`;

let modalFragment = (new DOMParser).parseFromString(MODAL_HTML, "text/html").body.children[0];
document.body.append(modalFragment);

const logEl = document.getElementById("ngat-log");
function log(text)
{
    if (logEl.textContent.length === 0)
        logEl.textContent = text;
    else
        logEl.textContent += "\n" + text;

    logEl.scrollTo({
        top: logEl.scrollHeight,
        left: 0,
        behavior: "instant"
    });
}

function getCookie(name)
{
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
}

document.getElementById("ngat-close").addEventListener("click", function()
{
    document.getElementById("ngat").remove();
});

document.getElementById("ngat-start").addEventListener("click", async function()
{
    try
    {
        const ONDEMAND_REGEX = /"ondemand\.s":"([a-z0-9]+)"/;

        document.getElementById("ngat-close").disabled = true;
        document.getElementById("ngat-start").disabled = true;

        log("Disabling auto-translation...");

        let homeResponse = await fetch("https://x.com/");
        let homeSrc = await homeResponse.text();
        
        let ondemandJs = getOndemandFileUrl(homeSrc);
        if (!ondemandJs)
        {
            log("Failed to get ondemand JS URL");
            return;
        }
        log(`ondemand JS URL: ${ondemandJs}`);

        let ondemandResponse = await fetch(ondemandJs);
        let ondemandJsSrc = await ondemandResponse.text();

        let transaction = new ClientTransaction(homeSrc, ondemandJsSrc);
        let transactionId = transaction.generateTransactionId("POST", "/graphql/3f9Qr6WPCh76-ip7h2r-tA/GrokAutoTranslationToggleMutation");

        log(`Transaction ID: ${transactionId}`);

        const KNOWN_LANG_IDS = [
            "en",
            "es",
            "fr",
            "en_gb",
            "ar",
            "ar_x_fm",
            "bn",
            "eu",
            "bg",
            "ca",
            "hr",
            "cs",
            "da",
            "nl",
            "fil",
            "fi",
            "gl",
            "de",
            "el",
            "gu",
            "he",
            "hi",
            "hu",
            "id",
            "ga",
            "it",
            "ja",
            "kn",
            "ko",
            "ms",
            "mr",
            "no",
            "fa",
            "pl",
            "pt",
            "ro",
            "ru",
            "sr",
            "zh_cn",
            "sk",
            "sv",
            "ta",
            "th",
            "zh_tw",
            "tr",
            "uk",
            "ur",
            "vi"
        ];

        for (const langId of KNOWN_LANG_IDS)
        {
            let r = await fetch("https://x.com/i/api/graphql/3f9Qr6WPCh76-ip7h2r-tA/GrokAutoTranslationToggleMutation", {
                "credentials": "include",
                "headers": {
                    "x-csrf-token": getCookie("ct0"),
                    "x-twitter-client-language": "en",
                    "x-twitter-active-user": "yes",
                    "x-client-transaction-id": transactionId, 
                    "authorization": "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
                },
                "referrer": "https://x.com/home",
                "method": "POST",
                "mode": "cors",
                body: JSON.stringify({
                    queryId: "3f9Qr6WPCh76-ip7h2r-tA",
                    variables: {
                        enable: false,
                        language: langId
                    }
                }),
            });
            
            if (r.status != 200)
            {
                log(`Disabling auto-translation for lang ${langId} failed with code ${r.status}`);
                log("Response body:");
                log(await r.text());
                document.getElementById("ngat-close").disabled = false;
                return;
            }

            log(`Disabled auto-translation for lang ${langId}. Waiting 500ms...`);
            await new Promise(r => setTimeout(r, 500));
        }

        log("Done! All Tweets will no longer be auto-translated for this account.");

        document.getElementById("ngat-close").disabled = false;
    }
    catch (e)
    {
        log("An error occurred.");
        log(`File: ${e.fileName}:${e.lineNumber}:${e.columnNumber}`);
        log("Stack trace:");
        log(e.stack);
    }
});