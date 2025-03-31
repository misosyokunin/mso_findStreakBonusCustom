javascript:(async()=>{
"use strict";

/*
┏━━━━━━━━━━━━━┓
┃ＭＳＯ＿連勝用カスタム探索┃
┗━━━━━━━━━━━━━┛
Developer:
	魚頭男（https://minesweeper.online/ja/player/16842796 ）
Writing:
	魚頭男（https://minesweeper.online/ja/player/16842796 ）

連勝ボーナスを得られるカスタムをいちいち探すのは面倒…。
というわけで、ツールを作りました。

=======================================================
このツールはMinesweeper.Online様（https://minesweeper.online/ 、以下「ＭＳＯ」）より公認を受けていない、非公認のものです。
当プログラムは、ＭＳＯ様とは一切関係ございませんので、このプログラムに関する質問・提言等の連絡は魚頭男（https://minesweeper.online/ja/player/16842796 、以下「魚」）までお願いします。
当プログラムについて、ＭＳＯ様に連絡することは絶対にしないでください。
運営者様並びにユーザー様にご迷惑にならないように努めておりますが、万が一のことがありましたら即削除いたします。
=======================================================
*/

/*
＝＝＝＝＝＝＝＝＝【使い方】＝＝＝＝＝＝＝＝＝
1.このスクリプトを実行して、統計ページへ飛びます。
2.「自分の統計」にチェックを入れます。
3.シーズンを昨シーズンなどにします。
4.画面下部の「集める」を押します。
5.ちょっと待ちます。
6.シーズンを探索し終わったら「終わる」ボタン押します。
7.あとはコピペするだけです。

1ページ辺り最短0.5秒で取得します
（環境によっては1秒以上掛かるかもしれません）。
スクリプト実行中は、できるだけタブの遷移やブラウザをバックグラウンドにしないようにしてください。

なお、他言語でも同じようなことができると思います。
ただ、このスクリプトのままでは動きませんので、適宜変えてください（「ja」や抽出文言）。
*/

/*＝＝＝＝＝＝＝＝＝＝【スクリプト実行確認】＝＝＝＝＝＝＝＝＝＝*/
{
	const TAR_URL = "https://minesweeper.online/ja/statistics";
	const TAR_TITLE = "統計画面";
	if(location.href.includes(TAR_URL)){
		
	}else{
		const result = window.confirm(`${TAR_TITLE}ではありません。\n${TAR_TITLE}へ飛びますか？\n（ページ遷移後に再度このスクリプトを実行してください。）`);
		if(result){
			const playerID = document.querySelector("#header .profile-link")?.href.match(/\d+/)[0];
			if(playerID){
				location.href = `${TAR_URL}/${playerID}`;
			}else{
				location.href = TAR_URL;
			}
		}else{
			alert(`${TAR_TITLE}（${TAR_URL}）を表示させてください。`);
		}
		return;
	}
}

/*＝＝＝＝＝＝＝＝＝＝【メイン処理】＝＝＝＝＝＝＝＝＝＝*/
const Wait = {
	waits : [],
	num : -1,
	add(){
		return new Promise((resolve) =>{
			this.num++;
			this.waits[this.num] = resolve;
		});
	},
	release(){
		this.waits[this.num]();
		this.waits[this.num] = "";
		this.num--;
	},
	time(sec){
		return new Promise((resolve) =>{
			setTimeout(function(){resolve();}, sec * 1000);
		});
	},
};

const WakeLock = new class{
	#wakeLock;
	constructor(){
		this.isSupported = "wakeLock" in navigator;
		this.check();
	}
	check(showMessage = false){
		if(showMessage){
			if(this.isSupported){
				console.log("起動ロック API に対応しています。");
			}else{
				console.log("このブラウザーは起動ロックに対応していません。");
			}
		}
		return this.isSupported;
	}
	async start(){
		if(!this.check(false)){
			return;
		}
		this.#wakeLock = null;
		try {
			this.#wakeLock = await navigator.wakeLock.request("screen");
			console.log("起動ロックが有効です。");
			this.#wakeLock.addEventListener("release", () => {
				console.log("起動ロックが解放されました");
			});
			document.addEventListener("visibilitychange", this.#windowEvent.bind(this));
		} catch (err) {
			console.log(`${err.name}, ${err.message}`);
		}
	}
	end(){
		if(!this.check(false)){
			return;
		}
		this.#wakeLock?.release().then(() => {
			this.#wakeLock = null;
		});
		document.removeEventListener("visibilitychange", this.#windowEvent.bind(this));
	}
	async #windowEvent(){
		if (this.#wakeLock !== null && document.visibilityState === "visible") {
			this.start();
		}
	}
};

class Pagination{
	constructor(param){
		this.paginationSelector = param["paginationSelector"];
		this.mainFunc = param["mainFunc"];
		this.endFunc = param["endFunc"];
		
		this.main();
	}
	async main(){
		await this.start();
		this.end();
	}
	async start(){
		while(true){
			this.mainFunc();
			
			const nextButton = document.querySelector(this.paginationSelector).querySelector(":scope > .next");
			await new Promise((resolve) => setTimeout(resolve, 0.5 * 1000));
			if(nextButton.classList.contains("disabled")){
				break;
			}
			
			await new Promise((resolve) => {
				const target = document.body;
				let toggleTwice = false;
				const observer = new MutationObserver(async (mutations) => {
					const tar = mutations[0].target;
			/*
					console.log(tar);
			*/
			/*
				ページネーションを操作するとstat_paginationが2回でる。
				2回目のstat_paginationで起動させたい
			*/
					if(tar.matches(this.paginationSelector)){
						toggleTwice = !toggleTwice;
						if(toggleTwice){
							return;
						}
						observer.disconnect();
						resolve();
					}
				});
				observer.observe(target, {
					characterData: true,	/*テキストノードの変化を監視*/
					childList: true,	/*子ノードの変化を監視*/
					subtree: true,	/*子孫ノードも監視対象に含める*/
				});
				
				nextButton.click();
			});
			
		}
	}
	end(){
		this.endFunc?.();
	}
}

function aho(){
	const trs = document.querySelectorAll("#stat_table > tbody > tr");
	for(let i = 0; i < trs.length; i++){
		const tr = trs[i];
		const tds = tr.querySelectorAll("td");
		if(tds[1].textContent === " "){	/*空行を弾く*/
			break;
		}
		const level = tds[0].textContent;
		if(!level.startsWith("カスタム (")){	/*カスタムNGを弾く*/
			continue;
		}
		if(tds[0].querySelector(":scope > img")){	/*複雑さ1000以上を弾く*/
			continue;
		}
		if(tds[2].firstChild.textContent === "0"){	/*未勝利を弾く*/
			continue;
		}
		putDatas.push(level.match(/(?<=\().+(?=\))/)[0]);	/*盤面サイズだけ取り出す*/
	}

}

/*＝＝＝＝＝＝＝＝＝＝【ユーザー操作】＝＝＝＝＝＝＝＝＝＝*/

function toggleInertMsoContents(){	/*スクリプト実行中は他のページへ移動する機能を制限させる*/
	document.querySelector(".sidebar-nav").toggleAttribute("inert");
	document.querySelector(".yaybar").toggleAttribute("inert");
	document.querySelector("#header").toggleAttribute("inert");
	document.querySelector(".socials").toggleAttribute("inert");
}
toggleInertMsoContents();
WakeLock.start();

const STYLE = `
#___________bk{
	position: fixed;
	bottom: 0px;
	left: 0px;
	width: 100%;
	background-color: rgba(0, 0, 0, 0.5);
	z-index: 1000;
}
#_______beginScreen{
	width: 100%;
	display: flex;
	flex-direction: column;	
}
#_____loadingText{
	height: 90vh;
	display: flex;
	align-items: center;
	justify-content: center;
}
.hiddenContent{
	display: none !important;
}
#_____bgsfooter{
	height: 10vh;
	display: flex;
	justify-content: space-around;
	width: 100%;
	padding: 0px;
}
#_____bgsfooter > *{
	width: 100%;
}

#_______endscreen{
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 100%;
	height: 100vh;
	padding: 5%;
}
#________edstextarea{
	height: 80%;
	width: 90%;
}
#______edsfooter{
	height: 20%;
	width: 100%;
	padding: 0px;
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	grid-template-rows: repeat(2, 1fr);
	gap: 0px;
}
`;

const bk = document.createElement("div");
bk.id = "___________bk";
document.body.append(bk);

const style = document.createElement("style");
style.innerHTML = STYLE;
bk.append(style);

const bgs = document.createElement("div");
bgs.id = "_______beginScreen";
bk.append(bgs);
{
	const text = document.createElement("p");
	text.id = "_____loadingText";
	text.classList.add("hiddenContent");
	bgs.append(text);
}
{
	const footer = document.createElement("footer");
	footer.id = "_____bgsfooter";
	bgs.append(footer);
	{
		const button = document.createElement("button");
		button.type = "button";
		button.textContent = "終わる";
		button.addEventListener("click", ()=>{
			Wait.release();
		});
		footer.append(button);
	}
	{
		const input = document.createElement("input");
		input.id = "______limitScore";
		input.type = "number";
		input.min = 0;
		input.step = 1;
		input.value = 100000;
		footer.append(input);
	}
	{
		const button = document.createElement("button");
		button.type = "button";
		button.textContent = "集める";
		button.addEventListener("click", async()=>{
			if(!document.getElementById("only_my").checked){
				if(!window.confirm("「自分の統計」にチェックが入っていません。\nそれでもよろしいでしょうか？")){
					return;
				}
			}
			if(document.getElementById("season_dropdown").textContent === "全時間"){
				if(!window.confirm("シーズンが「全時間」になっています。\nそれでもよろしいでしょうか？")){
					return;
				}
			}
			footer.setAttribute("inert", true);
			const text = document.getElementById("_____loadingText");
			text.innerText = `${document.getElementById("season_dropdown").textContent}のカスタムを取得中…\nしばらくお待ち下さい。`;
			text.classList.remove("hiddenContent");
			await new Promise((resolve) => {
				const pagination = new Pagination({
					"paginationSelector": "#stat_pagination",
					"mainFunc": aho,
					"endFunc": resolve,
				});
			});
			
			text.classList.add("hiddenContent");
			footer.removeAttribute("inert");
		});
		footer.append(button);
	}

}

const putDatas = [];
await Wait.add();	/*終わるボタン押下まで待ち*/


/*＝＝＝＝＝＝＝＝＝＝【データ表示】＝＝＝＝＝＝＝＝＝＝*/

bgs.classList.add("hiddenContent");

function calcOisisa(level){
/*
	美味しさ = 密度^3 * sqrt(幅 * 高さ) * cbrt(max(幅, 高さ) / min(幅,高さ));
*/
	const [haba, takasa, bakudan] = level.match(/\d+/g).map((exp) => Number(exp));
	const mitudo = (bakudan * 100 / (haba * takasa));
	let score = mitudo**3 * Math.sqrt(haba * takasa) * Math.cbrt(Math.max(haba, takasa) / Math.min(haba, takasa));
	score = score ** 5;
	score = score / 10e+21;
	score = Number(score.toFixed(2));
	return score;
}
let extDatas = [...new Set(putDatas)];
extDatas = extDatas.map((level) => {
	const temp = [
		level,
		Math.floor(calcOisisa(level)),
	];
	return temp;
});
const limit = Number(document.getElementById("______limitScore").value);
extDatas = extDatas.filter((data) => data[1] >= limit);
extDatas.sort((a, b) => a[1] - b[1]);
extDatas = extDatas.map((data, index) => {
	const temp = [
		index + 1,
		data[1],
		`https://minesweeper.online/ja/start/${data[0]}`,
	];
	return temp.join("\t");
});


const eds = document.createElement("div");
eds.id = "_______endscreen";
bk.append(eds);
{
	const textarea = document.createElement("textarea");
	textarea.id = "________edstextarea";
	textarea.value = extDatas.join("\n");
	eds.append(textarea);
	{
		const footer = document.createElement("footer");
		footer.id = "______edsfooter";
		eds.append(footer);
		{
			const button = document.createElement("button");
			button.type = "button";
			button.textContent = "再採番";
			button.addEventListener("click", ()=>{
				const strs = textarea.value.split("\n");
				let index = 0;
				const newstrs = strs.map((str) => {
					if(!str.match(/^\d+/)){
						return str;
					}
					index++;
					return str.replace(/^\d+/, index);
				});
				textarea.value = newstrs.join("\n");
			});
			footer.append(button);
		}
		{
			const button = document.createElement("button");
			button.type = "button";
			button.defaultText = "複雑さなどをセット🕰";
			button.textContent = button.defaultText;
			button.addEventListener("click", async()=>{
				footer.toggleAttribute("inert");
				const strs = textarea.value.split("\n");
				const strs_len = strs.length;
				const func = function(index){
					button.innerText = `カスタムデータを取得しています…⌛️\n${index} / ${strs_len}`;
				};
				func(0);
				let CustomIframe = document.getElementById("_________customIframe");
				if(!CustomIframe){
					let custom_constructor;
					await new Promise((resolve) => {
						custom_constructor = new GetCustomData({
							"iframeID": "_________customIframe",
							"startedCallback": resolve,
						});
					});
					CustomIframe = document.getElementById("_________customIframe");
					CustomIframe._methods = custom_constructor;
				}
				for(let i = 0; i < strs_len; i++){
					func(i);
					const level = strs[i].match(/\d+x\d+\/\d+/)?.[0];
					if(level){
						const ro = await CustomIframe._methods.get(level);
						strs[i] = strs[i] + "\t" + ro.join("\t");
					};
				}
				textarea.value = strs.join("\n");
				button.textContent = "カスタムデータをセットしました！😊";
				footer.toggleAttribute("inert");
				setTimeout(() => {
					button.textContent = button.defaultText;
				}, 3000);
			});
			footer.append(button);
		}
		{
			const button = document.createElement("button");
			button.type = "button";
			button.textContent = "コピーして終わる";
			button.addEventListener("click", ()=>{
				textarea.select();
				document.execCommand("copy");
				bk.remove();
				document.getElementById("_________customIframe")?.remove();
				toggleInertMsoContents();
				WakeLock.end();
			});
			footer.append(button);
		}
		{
			const button = document.createElement("button");
			button.type = "button";
			button.defaultText = "自分用メモに投稿する📒";
			button.textContent = button.defaultText;
			button.addEventListener("click", async()=>{
				const temp = textarea.value.split("\n");
				const temp_len = temp.length;
				temp.unshift("⏬カスタム連勝スクリプト⏬");
				temp.push("⏫カスタム連勝スクリプト⏫");
				const func = function(index){
					button.innerText = `メモに投稿しています…⌛️\n${index} / ${temp_len}`;
				};
				func(0);
				footer.toggleAttribute("inert");
				await new Promise((resolve) => {
					new SendMemo({
						"memos": temp,
						"sendCallback": func,
						"endCallback": resolve,
					});
				});
				button.textContent = "メモに投稿しました！😊";
				footer.toggleAttribute("inert");
				setTimeout(() => {
					button.textContent = button.defaultText;
				}, 3000);
				
			});
			footer.append(button);
		}
	}
}

class GetCustomData{
	constructor(param){
		this.iframeID = param["iframeID"];
		this.startedCallback = param["startedCallback"];
		this.start();
	}
	start(){
		const iframe = document.createElement("iframe");
		iframe.setAttribute("src", "https://minesweeper.online/ja/game/4426646346");
		iframe.style = "height: 100%; width: 100%;";
		iframe.id = this.iframeID;
		document.body.append(iframe);
		iframe.addEventListener("load", () => {
			const document = iframe.contentWindow.document;
			const target = document.body;
			const observer = new MutationObserver(async(mutations) => {
				const tar = mutations[0].target;
/*
				console.log(tar);
*/
				if(tar.id === "page"){
					this.startedCallback?.();
					observer.disconnect();
				}
			});
			observer.observe(target, {
				characterData: true,	/*テキストノードの変化を監視*/
				childList: true,	/*子ノードの変化を監視*/
				subtree: true,	/*子孫ノードも監視対象に含める*/
			});
			
		});
		this.iframe = iframe;
	}
	async get(level){
		const document = this.iframe.contentWindow.document;
		
		const [haba, takasa, bakudan] = level.match(/\d+/g);
		document.getElementById("custom_width").value = haba;
		document.getElementById("custom_height").value = takasa;
		document.getElementById("custom_mines").value = bakudan;
		
		let ro;
		return await new Promise((resolve) => {
			const target = document.body;
			const observer = new MutationObserver(async(mutations) => {
				const tar = mutations[0].target;
/*
				console.log(tar);
*/
				if(tar.id === "GameBottomPanelBlock"){
					await new Promise((resolve) => {
						setTimeout(resolve, 1000);
					});
					const content = document.getElementById("difficulty_popover").dataset.content;
					ro = [
						content.match(/(?<=爆弾の密度：<span class\="">)\d+\.?\d+%/)[0],
						content.match(/(?<=複雑さ：)\d+/)[0],
						content.match(/(?<=勝率：)\d+\.?\d+%/)[0],
					];
					observer.disconnect();
					resolve(ro);
				}
			});
			observer.observe(target, {
				characterData: true,	/*テキストノードの変化を監視*/
				childList: true,	/*子ノードの変化を監視*/
				subtree: true,	/*子孫ノードも監視対象に含める*/
			});
			
			document.querySelector(".btn-custom-update").click();
		});
	}
}

class SendMemo{
	constructor(param){
		this.memos = param["memos"];
		this.sendCallback = param["sendCallback"];
		this.endCallback = param["endCallback"];
		this.start();
	}
	start(){
		const iframe = document.createElement("iframe");
		iframe.setAttribute("src", "https://minesweeper.online/ja/chat");
		iframe.style = "height: 100%; width: 100%";
		document.body.append(iframe);
		iframe.addEventListener("load", () => {
			this.main(iframe.contentWindow.document);
		});
		this.iframe = iframe;
	}
	end(){
		this.iframe.remove();
		this?.endCallback();
	}
	main(document){
		const target = document.body;
		const observer = new MutationObserver(async(mutations) => {
			const tar = mutations[0].target;
/*
			console.log(tar);
*/
			if(tar.id.includes("chat_tab_count_")){
				const memo = document.querySelector("img[src='/img/chat/notes.svg']");
				if(!memo){
					alert("自分用メモ用意してね");
					observer.disconnect();
					this.end();
					return;
				}
				memo.click();
			}
			if(tar.id.includes("chat_channel_")){
				setTimeout(async() => {
					for(let i = 0; i < this.memos.length; i++){
						this.send(document, this.memos[i]);
						await Wait.time(0.5);
						this?.sendCallback(i);
					}
					this.end();
				}, 100);
				observer.disconnect();
			}
		});
		observer.observe(target, {
			characterData: true,	/*テキストノードの変化を監視*/
			childList: true,	/*子ノードの変化を監視*/
			subtree: true,	/*子孫ノードも監視対象に含める*/
		});
	}
	send(document, msg){
		document.getElementById("chat_new_message").value = msg;
		document.getElementById("chat_send_button").click();
	}
}

})();
