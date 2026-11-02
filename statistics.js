const totalElement=
    document.getElementById("total");

const safeElement=
    document.getElementById("safe");

const dangerElement=
    document.getElementById("danger");

const safePercentElement=
    document.getElementById("safePercent");

const historyBody=
    document.getElementById("historyBody");

function loadStatistics(){

    chrome.storage.local.get(
        [
            "scanCount",
            "safeCount",
            "dangerCount",
            "scanHistory"
        ],
        data=>{

            const total=
                Number(
                    data.scanCount||0
                );

            const safe=
                Number(
                    data.safeCount||0
                );

            const danger=
                Number(
                    data.dangerCount||0
                );

            totalElement.textContent=
                total;

            safeElement.textContent=
                safe;

            dangerElement.textContent=
                danger;

            const percent=
                total>0
                    ?Math.round(
                        safe/
                        total*
                        100
                    )
                    :0;

            safePercentElement.textContent=
                `${percent}%`;

            renderHistory(
                Array.isArray(
                    data.scanHistory
                )
                    ?data.scanHistory
                    :[]
            );
        }
    );
}

function renderHistory(history){

    if(!history.length){

        historyBody.innerHTML=`
            <tr>
                <td
                    colspan="5"
                    class="empty">
                    ยังไม่มีประวัติการตรวจสอบ
                </td>
            </tr>
        `;

        return;
    }

    historyBody.innerHTML=
        history
            .map(item=>{

                const date=
                    new Date(
                        item.time
                    );

                const phishing=
                    Number(
                        item.prediction
                    )===0;

                return `
                    <tr>

                        <td>
                            ${date.toLocaleString("th-TH")}
                        </td>

                        <td class="url-cell">
                            ${escapeHtml(
                                item.url||"-"
                            )}
                        </td>

                        <td>
                            <span
                                class="badge ${
                                    phishing
                                        ?"risk"
                                        :"safe"
                                }">
                                ${
                                    phishing
                                        ?"Phishing"
                                        :"ปลอดภัย"
                                }
                            </span>
                        </td>

                        <td>
                            ${Number(
                                item.risk||0
                            )}%
                        </td>

                        <td>
                            ${Number(
                                item.confidence||0
                            )}%
                        </td>

                    </tr>
                `;

            })
            .join("");
}

function escapeHtml(text){

    return String(text)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}

document
    .getElementById("clearHistory")
    .addEventListener(
        "click",
        ()=>{

            if(
                !confirm(
                    "ต้องการล้างประวัติทั้งหมดหรือไม่?"
                )
            ){
                return;
            }

            chrome.storage.local.set({
                scanCount:0,
                safeCount:0,
                dangerCount:0,
                scanHistory:[]
            },()=>{
                loadStatistics();
            });

        }
    );

document
    .getElementById("analysisNav")
    .addEventListener(
        "click",
        ()=>{
            chrome.runtime.sendMessage({
                type:"open_page",
                page:"analysis.html"
            });
        }
    );

loadStatistics();