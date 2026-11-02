console.log("✅ Phishing Detector AI Started");

const API_URL="https://phishing-detector-api-bx66.onrender.com/predict";

chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
    if(message.type==="predict"){
        fetch(API_URL,{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify(message.features)
        })
        .then(async response=>{
            if(!response.ok){
                throw new Error(`HTTP ${response.status}`);
            }
            const data=await response.json();
            console.log("✅ API Response:",data);
            saveScanResult(sender,message.features,data);
            sendResponse(data);
        })
        .catch(error=>{
            console.error("❌ API Error:",error);
            sendResponse({
                error:true,
                message:error.message
            });
        });
        return true;
    }

    if(message.type==="get_last_scan"){
        chrome.storage.local.get(["lastScan"],result=>{
            sendResponse(result.lastScan||null);
        });
        return true;
    }

    if(message.type==="open_page"){
        chrome.tabs.create({
            url:chrome.runtime.getURL(message.page)
        });
        sendResponse({
            success:true
        });
        return true;
    }
});

function saveScanResult(sender,features,data){
    const prediction=Number(data.prediction||0);
    const confidence=Number(data.confidence||0);
    const risk=Number(data.risk||0);

    const scan={
        url:sender?.tab?.url||"",
        title:sender?.tab?.title||"",
        prediction:prediction,
        confidence:confidence,
        risk:risk,
        features:features,
        time:new Date().toISOString()
    };

    chrome.storage.local.set({
        lastScan:scan
    });

    chrome.storage.local.get(
        [
            "scanCount",
            "safeCount",
            "dangerCount",
            "scanHistory"
        ],
        result=>{
            let scanCount=Number(result.scanCount||0);
            let safeCount=Number(result.safeCount||0);
            let dangerCount=Number(result.dangerCount||0);
            let scanHistory=Array.isArray(result.scanHistory)
                ? result.scanHistory
                : [];

            scanCount++;

            if(prediction===1){
                safeCount++;
            }else{
                dangerCount++;
            }

            scanHistory.unshift(scan);

            if(scanHistory.length>50){
                scanHistory=scanHistory.slice(0,50);
            }

            chrome.storage.local.set({
                scanCount:scanCount,
                safeCount:safeCount,
                dangerCount:dangerCount,
                scanHistory:scanHistory
            });
        }
    );
}