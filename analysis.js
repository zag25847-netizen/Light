const urlElement=
    document.getElementById("url");

const confidenceElement=
    document.getElementById("confidence");

const predictionElement=
    document.getElementById("prediction");

const scanTimeElement=
    document.getElementById("scanTime");

const featureGrid=
    document.getElementById("featureGrid");

const featureNames=[
    ["IsHTTPS","HTTPS"],
    ["HasTitle","Title"],
    ["HasFavicon","Favicon"],
    ["NoOfURLRedirect","Redirect"],
    ["NoOfPopup","Popup"],
    ["NoOfiFrame","Iframe"],
    ["HasExternalFormSubmit","External Form Submit"],
    ["HasSubmitButton","Submit Button"],
    ["HasHiddenFields","Hidden Field"],
    ["HasPasswordField","Password Field"],
    ["NoOfImage","Images"],
    ["NoOfCSS","CSS"],
    ["NoOfJS","JavaScript"],
    ["NoOfExternalRef","External Resources"]
];

function loadData(){

    chrome.runtime.sendMessage(
        {
            type:"get_last_scan"
        },
        data=>{

            if(
                chrome.runtime.lastError||
                !data
            ){
                showNoData();
                return;
            }

            renderData(data);
        }
    );
}

function renderData(data){

    urlElement.textContent=
        data.url||"-";

    confidenceElement.textContent=
        `${data.confidence||0}%`;

    predictionElement.textContent=
        Number(data.prediction)===0
            ?"Phishing"
            :"ปลอดภัย";

    scanTimeElement.textContent=
        new Date(
            data.time
        ).toLocaleString(
            "th-TH"
        );

    const features=
        data.features||{};

    featureGrid.innerHTML=
        featureNames
            .map(item=>{

                const key=item[0];
                const label=item[1];
                const value=
                    Number(features[key]||0);

                let risky=false;

                if(
                    key==="IsHTTPS"&&
                    value===0
                ){
                    risky=true;
                }

                if(
                    key==="NoOfiFrame"&&
                    value>0
                ){
                    risky=true;
                }

                if(
                    key==="HasExternalFormSubmit"&&
                    value===1
                ){
                    risky=true;
                }

                if(
                    key==="HasHiddenFields"&&
                    value===1
                ){
                    risky=true;
                }

                if(
                    key==="HasPasswordField"&&
                    value===1
                ){
                    risky=true;
                }

                if(
                    key==="NoOfExternalRef"&&
                    value>20
                ){
                    risky=true;
                }

                let text=value;

                if(
                    key==="IsHTTPS"||
                    key==="HasTitle"||
                    key==="HasFavicon"||
                    key==="HasExternalFormSubmit"||
                    key==="HasSubmitButton"||
                    key==="HasHiddenFields"||
                    key==="HasPasswordField"
                ){
                    text=
                        value===1
                            ?"พบ"
                            :"ไม่พบ";
                }

                return `
                    <div class="feature">
                        <span class="feature-name">
                            ${label}
                        </span>
                        <span class="badge ${
                            risky
                                ?"risk"
                                :"safe"
                        }">
                            ${text}
                        </span>
                    </div>
                `;
            })
            .join("");
}

function showNoData(){

    urlElement.textContent=
        "ยังไม่มีข้อมูล";

    confidenceElement.textContent=
        "-";

    predictionElement.textContent=
        "-";

    scanTimeElement.textContent=
        "-";

    featureGrid.innerHTML=`
        <div class="no-data">
            ยังไม่มีผลการตรวจสอบเว็บไซต์
            <br><br>
            กรุณาเปิดเว็บไซต์
            และรอให้ระบบตรวจสอบก่อน
        </div>
    `;
}

document
    .getElementById("refresh")
    .addEventListener(
        "click",
        loadData
    );

document
    .getElementById("historyNav")
    .addEventListener(
        "click",
        ()=>{
            chrome.runtime.sendMessage({
                type:"open_page",
                page:"statistics.html"
            });
        }
    );

loadData();