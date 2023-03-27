// // For more information on the search parameters visit https://newsapi.org/docs/endpoints/everything



const apiKey = "1261b781038644dd8fb9c337b52efee9";
const apiKey2 = "1da0001aa4f54fab849d7f475e718659";

var startDate ="";
var endDate = "";
var keywords = [];
var sources = [];

var articles = [];


const gptApiKey = "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";
const gptApiUrl = "https://api.openai.com/v1/chat/completions";

async function makeGptSummary(element){

    let articleUrl = element.parentElement.parentElement.children[3].children[0].href;

    // Set the request body
    const data = JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{"role": "user", "content": "Summarize this article in 5 sentences: " + articleUrl}],
        max_tokens: 100,
        n: 1,
        temperature: 0.5,
    });

    let cell = element.parentElement;
    cell.innerHTML = "";
    var loadingEl = document.createElement('img');
    loadingEl.src = "assets/spinner-solid.svg";
    loadingEl.classList.add("loading");
    cell.appendChild(loadingEl);


    const description = await gptApiCall(data);
    cell.innerHTML = description.choices[0].message.content;

}

async function gptApiCall(sendData) {
    // Set the request headers
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", 'Bearer ' + gptApiKey);

    // Make the API call using the fetch function
    try{
        const response = await fetch(gptApiUrl, {
            method: "POST",
            headers: headers,
            body: sendData,
        });
        const data = await response.json();
        console.log(data);
        return data;
    }catch(error){
        console.log(error);
    }
}

function getSearchParams(){
    keywords = [];
    sources = [];
    startDate = $("#start")[0].value;
    endDate = $("#end")[0].value;
    articles = [];

    let keywordList = Array.from($(".selection.keywords")[0].children);
    keywordList.map(element => {
        if(element.children[1].classList.contains("selected")){
            keywords.push(element.children[0].innerHTML)
        }
    });

    let sourceList = Array.from($(".selection.sources")[0].children);
    sourceList.map(element => {
        if(element.children[1].classList.contains("selected")){
            sources.push(element.children[0].innerHTML)
        }
});
}

async function apiCall(keyword,from,to,page=1) {
    const url = `https://newsapi.org/v2/everything?q=${keyword}&from=${from}&to=${to}&language=en&sortBy=relevancy&page=${page}&pagesize=100&apiKey=${apiKey2}`;
    try{
        const response = await fetch(url);
        const data = await response.json();
        return data;
    }catch(err){
        console.log(err);
    }
}

async function getArticles(){
    getSearchParams();
    for(let i=0; i<keywords.length;i++){
        let data = await apiCall(keywords[i],startDate,endDate);
        articles = [].concat(articles,data.articles);
        // Below is the code to make additional api calls when there are more than the 100 result page limit
        // let numResults = data.totalResults;
        // if(numResults>100){
        //     let numPages = Math.floor(numResults/100) - 1;
        //     for(let j=0;j<numPages;j++){
        //         let data = await apiCall(keywords[i],startDate,endDate,j+2);
        //         articles = [].concat(articles,data.articles);
        //     }
        // }
        
    }
}

function cleanData(){
    // Removing any dupicate articles based on url
    articles = articles.filter((value, index, self) =>
        index === self.findIndex((t) => (
            t.url === value.url
        ))
    );

    let sourceEl =  Array.from($(".selection.sources")[0].children);
    let allSources = false;
    sourceEl.map(element => {
        if(element.children[1].classList.contains("selected")){
            sources.push(element.children[0].dataset.value);
        }
    });
    if(sources.includes("allow-all")){allSources = true;}

    if(allSources == false){
        //Check if the article is from a source we want
        articles = articles.filter(article => {
            let ret = false;
            for (const source of sources) {
                if(article.url.includes(source)){
                    ret = true;
                }
            }
            return ret;
        });
    }
}

function displayArticles(){
    let table = $(".table-container")[0];
    articles.map(element => {
        var tableRow = document.createElement('div');
        tableRow.classList.add("table-row");
        // Source
        let source = document.createElement('div');
        source.classList.add("table-cell");
        source.classList.add("source");
        source.innerHTML = element.source.name;
        tableRow.appendChild(source);
        // Title
        let title = document.createElement('div');
        title.classList.add("table-cell");
        title.classList.add("title");
        title.innerHTML = element.title;
        tableRow.appendChild(title);
        // Description
        let description = document.createElement('div');
        description.classList.add("table-cell");
        description.classList.add("description");
        description.innerHTML = element.description;
        tableRow.appendChild(description);
        // Description
        let url = document.createElement('div');
        url.classList.add("table-cell");
        url.classList.add("url");
        let urlLink = document.createElement('a');
        urlLink.innerHTML = element.url;
        urlLink.href = element.url;
        url.appendChild(urlLink);
        tableRow.appendChild(url);
        // gpt
        let gpt = document.createElement('div');
        gpt.classList.add("table-cell");
        gpt.classList.add("gpt");
        let gptButton = document.createElement('div');
        gptButton.classList.add("summarize-button");
        gptButton.innerHTML = "GPT SUMMARIZE";

        gpt.appendChild(gptButton);
        tableRow.appendChild(gpt);
        table.appendChild(tableRow);
    });
    if(articles.length == 0){
        var tableRow = document.createElement('div');
        tableRow.classList.add("table-row");
        tableRow.classList.add("no-result");
        tableRow.innerHTML = "NO RESULTS";
        table.appendChild(tableRow);
    }
}

async function searchAndDisplay(){
    let searchButton = $('.search-button')[0];
    var loadingEl = document.createElement('img');
    loadingEl.src = "assets/spinner-solid.svg";
    loadingEl.classList.add("loading");
    searchButton.innerHTML = "";
    searchButton.appendChild(loadingEl);
    clearTable();
    const result = await getArticles();
    cleanData();
    displayArticles();
    searchButton.innerHTML = "SEARCH";
}

function clearTable(){
    let tableHeader = $(".table-header")[0];

    $(".table-container")[0].innerHTML = "";
    $(".table-container")[0].appendChild(tableHeader);
}

async function readInArticles() {
    try {
        fetch('articles.json')
        .then((response) => response.json())
        .then((responseJSON) => {
            articles = responseJSON;
            this.cleanData();
            this.displayArticles();
        });
    } catch (error) {
        console.error(error);
    }
}

$(".search-button").click(function() {
    searchAndDisplay();
});

$(".toggle-dropdown.keywords").click(function() {
    $(".selection.keywords").toggleClass("hide");
});

$(".toggle-dropdown.sources").click(function() {
    $(".selection.sources").toggleClass("hide");
});

$(".select-item").click(function() {
    $(this.children[1]).toggleClass('selected')
});

$(document).on("click", ".summarize-button", function(){
    makeGptSummary(this);
});



