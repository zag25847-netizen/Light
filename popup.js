const scanButton=document.getElementById("scan");
const result=document.getElementById("result");

scanButton.addEventListener("click",async()=>{
    scanButton.disabled=true;
    scanButton.textContent="กำลังตรวจสอบ...";
    result.textContent="กำลังวิเคราะห์เว็บไซต์";

    try{
        const tabs=await chrome.tabs.query({
            active:true,
            currentWindow:true
        });

        if(!tabs.length){
            throw new Error("ไม่พบแท็บ");
        }

        chrome.tabs.sendMessage(
            tabs[0].id,
            {
                type:"manual_scan"
            },
            response=>{

                if(chrome.runtime.lastError){
                    result.textContent=
                        "ไม่สามารถตรวจสอบเว็บนี้ได้";
                    scanButton.disabled=false;
                    scanButton.textContent=
                        "⌕ ตรวจสอบเว็บไซต์";
                    return;
                }

                if(!response||response.error){
                    result.textContent=
                        "เกิดข้อผิดพลาด";
                    scanButton.disabled=false;
                    scanButton.textContent=
                        "⌕ ตรวจสอบเว็บไซต์";
                    return;
                }

                if(
                    Number(response.prediction)===0
                ){
                    result.textContent=
                        `พบความเสี่ยง ${response.risk||0}%`;
                }else{
                    result.textContent=
                        `เว็บไซต์ปลอดภัย ${response.confidence||0}%`;
                }

                scanButton.disabled=false;
                scanButton.textContent=
                    "⌕ ตรวจสอบเว็บไซต์";

                setTimeout(()=>{
                    window.close();
                },800);
            }
        );
    }catch(error){
        result.textContent=error.message;
        scanButton.disabled=false;
        scanButton.textContent=
            "⌕ ตรวจสอบเว็บไซต์";
    }
});

document
    .getElementById("analysisBtn")
    .addEventListener("click",()=>{
        chrome.runtime.sendMessage({
            type:"open_page",
            page:"analysis.html"
        });
    });

document
    .getElementById("historyBtn")
    .addEventListener("click",()=>{
        chrome.runtime.sendMessage({
            type:"open_page",
            page:"statistics.html"
        });
    });