let isScanning=false;
let lastScannedUrl="";
let lastScanTime=0;

function collectFeatures(){
    return {
        URLLength:location.href.length,
        IsHTTPS:location.protocol==="https:"?1:0,
        HasTitle:document.title.trim()!==""?1:0,
        HasFavicon:document.querySelector('link[rel*="icon"]')?1:0,
        NoOfURLRedirect:0,
        NoOfPopup:0,
        NoOfiFrame:document.querySelectorAll("iframe").length,
        HasExternalFormSubmit:document.querySelector('form[action^="http"]')?1:0,
        HasSubmitButton:document.querySelector('button[type="submit"],input[type="submit"]')?1:0,
        HasHiddenFields:document.querySelector('input[type="hidden"]')?1:0,
        HasPasswordField:document.querySelector('input[type="password"]')?1:0,
        NoOfImage:document.images.length,
        NoOfCSS:document.querySelectorAll('link[rel="stylesheet"]').length,
        NoOfJS:document.scripts.length,
        NoOfExternalRef:document.querySelectorAll('img[src^="http"],script[src^="http"],link[href^="http"]').length
    };
}

function scanWebsite(){
    if(isScanning){
        return;
    }

    if(
        location.href===lastScannedUrl &&
        Date.now()-lastScanTime<10000
    ){
        return;
    }

    isScanning=true;
    lastScanTime=Date.now();
    lastScannedUrl=location.href;

    const features=collectFeatures();

    console.log("=================================");
    console.log("🛡️ PHISHING DETECTOR AI");
    console.log("🌐 URL:",location.href);
    console.log("📊 FEATURES:",features);
    console.log("📡 Sending to API...");

    chrome.runtime.sendMessage({
        type:"predict",
        features:features
    },result=>{
        isScanning=false;

        if(chrome.runtime.lastError){
            console.error(
                "❌ Runtime Error:",
                chrome.runtime.lastError.message
            );
            showSmallNotice(
                "ระบบตรวจสอบ",
                "ไม่สามารถเชื่อมต่อกับระบบประมวลผลได้",
                "warning"
            );
            return;
        }

        if(!result){
            console.error("❌ No response");
            showSmallNotice(
                "ระบบตรวจสอบ",
                "ไม่พบผลการวิเคราะห์",
                "warning"
            );
            return;
        }

        if(result.error){
            console.error(
                "❌ API Error:",
                result.message
            );
            showSmallNotice(
                "ระบบตรวจสอบ",
                "ไม่สามารถตรวจสอบเว็บไซต์ได้",
                "warning"
            );
            return;
        }

        console.log("✅ API RESULT:",result);

        if(Number(result.prediction)===0){
            showWarning(result,features);
        }else{
            showSafeNotice(result);
        }
    });
}

function showSafeNotice(result){
    removeSmallNotice();

    const confidence=Number(result.confidence||0);

    const notice=document.createElement("div");
    notice.id="pdai-safe-notice";

    notice.innerHTML=`
        <div class="pdai-safe-inner">
            <div class="pdai-safe-icon">✓</div>
            <div class="pdai-safe-content">
                <div class="pdai-safe-title">
                    เว็บไซต์ปลอดภัย
                </div>
                <div class="pdai-safe-text">
                    ไม่พบความเสี่ยงจากการวิเคราะห์
                    <br>
                    ความเชื่อมั่น ${confidence}%
                </div>
            </div>
            <button
                class="pdai-notice-close"
                id="pdai-safe-close">
                ×
            </button>
        </div>
    `;

    document.documentElement.appendChild(notice);

    const close=document.getElementById("pdai-safe-close");

    if(close){
        close.onclick=()=>{
            notice.remove();
        };
    }

    setTimeout(()=>{
        if(document.getElementById("pdai-safe-notice")){
            notice.remove();
        }
    },5000);
}

function showSmallNotice(title,message,type){
    removeSmallNotice();

    const notice=document.createElement("div");
    notice.id="pdai-small-notice";

    notice.innerHTML=`
        <div class="pdai-small-inner">
            <div class="pdai-small-icon">
                ⚠
            </div>
            <div class="pdai-small-text">
                <strong>${escapeHtml(title)}</strong>
                <span>${escapeHtml(message)}</span>
            </div>
            <button
                class="pdai-notice-close"
                id="pdai-small-close">
                ×
            </button>
        </div>
    `;

    document.documentElement.appendChild(notice);

    const close=document.getElementById("pdai-small-close");

    if(close){
        close.onclick=()=>{
            notice.remove();
        };
    }

    setTimeout(()=>{
        if(document.getElementById("pdai-small-notice")){
            notice.remove();
        }
    },5000);
}

function removeSmallNotice(){
    const safe=document.getElementById("pdai-safe-notice");
    const small=document.getElementById("pdai-small-notice");

    if(safe){
        safe.remove();
    }

    if(small){
        small.remove();
    }
}

function showWarning(result,features){
    if(document.getElementById("phishing-overlay")){
        return;
    }

    removeSmallNotice();

    const risk=Math.min(
        100,
        Number(result.risk||0)
    );

    const confidence=Number(
        result.confidence||0
    );

    let level="ความเสี่ยงต่ำ";

    if(risk>=70){
        level="ความเสี่ยงสูง";
    }else if(risk>=40){
        level="เว็บไซต์น่าสงสัย";
    }

    let summary="";

    if(risk>=80){
        summary="เว็บไซต์นี้มีความเสี่ยงสูง ไม่ควรกรอกข้อมูลส่วนตัวหรือรหัสผ่าน";
    }else if(risk>=50){
        summary="เว็บไซต์นี้มีความเสี่ยงปานกลาง ควรตรวจสอบ URL และแหล่งที่มาก่อนใช้งาน";
    }else{
        summary="ระบบตรวจพบลักษณะที่อาจเกี่ยวข้องกับเว็บไซต์ฟิชชิง ควรตรวจสอบก่อนใช้งาน";
    }

    let reasons=[];

    if(features.IsHTTPS===0){
        reasons.push("เว็บไซต์ไม่ได้ใช้งาน HTTPS");
    }

    if(features.URLLength>75){
        reasons.push("URL มีความยาวมากผิดปกติ");
    }

    if(features.HasPasswordField===1){
        reasons.push("พบช่องกรอกรหัสผ่าน");
    }

    if(features.HasHiddenFields===1){
        reasons.push("พบ Hidden Field");
    }

    if(features.HasExternalFormSubmit===1){
        reasons.push("พบการส่งข้อมูลฟอร์มไปยังเว็บไซต์ภายนอก");
    }

    if(features.NoOfiFrame>0){
        reasons.push("พบ iframe ภายในเว็บไซต์");
    }

    if(features.NoOfExternalRef>20){
        reasons.push("พบการอ้างอิงทรัพยากรภายนอกจำนวนมาก");
    }

    if(reasons.length===0){
        reasons.push("ไม่พบปัจจัยเสี่ยงที่เด่นชัด");
    }

    const degree=risk*3.6;

    const overlay=document.createElement("div");
    overlay.id="phishing-overlay";

    overlay.innerHTML=`

        <div class="warning-box">

            <div class="pd-header">

                <div class="pd-brand">

                    <div class="pd-logo">
                        🛡️
                    </div>

                    <div>

                        <div class="pd-title">
                            Phishing Detector
                            <span>AI</span>
                        </div>

                        <div class="pd-subtitle">
                            ตรวจสอบเว็บไซต์ด้วย Machine Learning
                        </div>

                    </div>

                </div>

                <button
                    id="closeWarning"
                    class="pd-close">
                    ×
                </button>

            </div>

            <div class="pd-alert">

                <div class="pd-alert-icon">
                    !
                </div>

                <div>

                    <div class="pd-alert-title">
                        ตรวจพบเว็บไซต์ที่มีความเสี่ยง
                    </div>

                    <div class="pd-alert-text">
                        เว็บไซต์นี้อาจเป็นเว็บไซต์ฟิชชิง
                    </div>

                </div>

            </div>

            <div class="pd-url">

                <div class="pd-url-text">
                    🔗
                    ${escapeHtml(location.href)}
                </div>

                <div class="pd-risk-tag">
                    ⚠ เสี่ยงสูง
                </div>

            </div>

            <div class="pd-risk-area">

                <div class="pd-circle"
                    style="
                        background:
                        conic-gradient(
                            #ff3150 0deg,
                            #ff3150 ${degree}deg,
                            #24384e ${degree}deg
                        );
                    ">

                    <div class="pd-circle-inner">

                        <strong>
                            ${risk}%
                        </strong>

                        <span>
                            Risk Score
                        </span>

                    </div>

                </div>

                <div class="pd-info">

                    <div class="pd-info-row">

                        <span>
                            ระดับความเสี่ยง
                        </span>

                        <strong class="danger">
                            ${level}
                        </strong>

                    </div>

                    <div class="pd-info-row">

                        <span>
                            ความเชื่อมั่นของโมเดล
                        </span>

                        <strong>
                            ${confidence}%
                        </strong>

                    </div>

                    <div class="pd-info-row">

                        <span>
                            ตรวจสอบเมื่อ
                        </span>

                        <strong>
                            ${new Date().toLocaleTimeString("th-TH")}
                        </strong>

                    </div>

                </div>

            </div>

            <div class="pd-ai">

                <div class="pd-ai-title">
                    🤖 AI วิเคราะห์พบว่า
                </div>

                ${reasons.map(reason=>`
                    <div class="pd-reason">
                        <span>●</span>
                        <span>
                            ${escapeHtml(reason)}
                        </span>
                    </div>
                `).join("")}

            </div>

            <div class="pd-summary">
                ${summary}
            </div>

            <div class="pd-cards">

                <div class="pd-card model">

                    <div>
                        🤖 MODEL
                    </div>

                    <strong>
                        Random Forest
                    </strong>

                </div>

                <div class="pd-card confidence">

                    <div>
                        🎯 CONFIDENCE
                    </div>

                    <strong>
                        ${confidence}%
                    </strong>

                </div>

                <div class="pd-card result">

                    <div>
                        🛡 RESULT
                    </div>

                    <strong>
                        PHISHING
                    </strong>

                </div>

            </div>

            <div class="pd-time">
                ตรวจสอบเมื่อ
                ${new Date().toLocaleString("th-TH")}
            </div>

            <div class="pd-buttons">

                <button
                    id="backPage"
                    class="pd-back">

                    ← กลับไปยังหน้าเดิมที่ปลอดภัย

                </button>

                <button
                    id="continuePage"
                    class="pd-continue">

                    เข้าต่อ (ไม่แนะนำ) →

                </button>

            </div>

        </div>

    `;

    document.documentElement.appendChild(overlay);

    document.getElementById(
        "closeWarning"
    ).onclick=()=>{
        overlay.remove();
    };

    document.getElementById(
        "backPage"
    ).onclick=()=>{
        history.back();
    };

    document.getElementById(
        "continuePage"
    ).onclick=()=>{
        overlay.remove();
    };
}

function escapeHtml(text){
    return String(text)
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");
}

function checkUrlChange(){

    if(location.href!==lastScannedUrl){

        console.log(
            "🔄 URL Changed:",
            location.href
        );

        lastScannedUrl="";

        const overlay=document.getElementById(
            "phishing-overlay"
        );

        if(overlay){
            overlay.remove();
        }

        removeSmallNotice();

        setTimeout(()=>{
            scanWebsite();
        },1200);
    }
}

const originalPushState=
    history.pushState;

history.pushState=function(){

    const result=
        originalPushState.apply(
            this,
            arguments
        );

    window.dispatchEvent(
        new Event(
            "pdai-url-change"
        )
    );

    return result;
};

const originalReplaceState=
    history.replaceState;

history.replaceState=function(){

    const result=
        originalReplaceState.apply(
            this,
            arguments
        );

    window.dispatchEvent(
        new Event(
            "pdai-url-change"
        )
    );

    return result;
};

window.addEventListener(
    "popstate",
    ()=>{
        window.dispatchEvent(
            new Event(
                "pdai-url-change"
            )
        );
    }
);

window.addEventListener(
    "pdai-url-change",
    ()=>{
        setTimeout(()=>{
            checkUrlChange();
        },300);
    }
);

chrome.runtime.onMessage.addListener(
    (
        message,
        sender,
        sendResponse
    )=>{

        if(message.type==="manual_scan"){

            lastScanTime=0;
            lastScannedUrl="";

            const features=
                collectFeatures();

            chrome.runtime.sendMessage({
                type:"predict",
                features:features
            },result=>{

                if(
                    chrome.runtime.lastError
                ){

                    sendResponse({
                        error:true,
                        message:
                            chrome.runtime
                                .lastError
                                .message
                    });

                    return;
                }

                if(!result){

                    sendResponse({
                        error:true,
                        message:
                            "ไม่พบผลลัพธ์"
                    });

                    return;
                }

                if(
                    Number(
                        result.prediction
                    )===0
                ){

                    showWarning(
                        result,
                        features
                    );

                }else{

                    showSafeNotice(
                        result
                    );
                }

                sendResponse(
                    result
                );
            });

            return true;
        }
    }
);

setTimeout(()=>{
    console.log(
        "🚀 Auto Scan Started"
    );
    scanWebsite();
},1500);

setInterval(()=>{
    checkUrlChange();
},1500);