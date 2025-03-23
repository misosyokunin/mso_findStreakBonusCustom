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
4.画面下部の「収集する」を押します。
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
			location.href = TAR_URL;
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



async function nextPage(callback){
	const target = document.body;
	const observer = new MutationObserver(async function (mutations) {
		const tar = mutations[0].target;
/*
		console.log(tar);
*/
		if(tar.id === "stat_pagination"){
			if(!isTwice){
				isTwice = true;
				return;
			}
			isTwice = false;
			callback();
			observer.disconnect();
			Wait.release();
		}
	});
	observer.observe(target, {
		characterData: true,	/*テキストノードの変化を監視*/
		childList: true,	/*子ノードの変化を監視*/
		subtree: true,	/*子孫ノードも監視対象に含める*/
	});
	
	const nextButton = document.querySelector("#stat_pagination > .next");
	if(nextButton.classList.contains("disabled")){
		isLooping = false;
		observer.disconnect();
		return;
	}else{
		nextButton.click();
		await Wait.add();
		await Wait.time(0.5);
	}
}

function aho(){
	const trs = document.querySelectorAll("#stat_table > tbody > tr");
	for(let i = 0; i < trs.length; i++){
		const tr = trs[i];
		const tds = tr.querySelectorAll("td");
		if(tds[1].textContent === " "){
			console.log("break");
			break;
		}
		const level = tds[0].textContent;
		if(!level.startsWith("カスタム (")){
			continue;
		}
		if(tds[0].querySelector(":scope > img")){	/*複雑さ1000以上を弾く*/
			continue;
		}
		putDatas.push(level.match(/(?<=\().+(?=\))/)[0]);	/*盤面サイズだけ取り出す*/
	}

}

/*＝＝＝＝＝＝＝＝＝＝【ユーザー操作】＝＝＝＝＝＝＝＝＝＝*/

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
	height: 90%;
	width: 90%;
}
#______edsfooter{
	height: 10%;
	display: flex;
	justify-content: space-around;
	width: 100%;
	padding: 0px;
}
#______edsfooter > *{
	width: 100%
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
		input.value = 200000;
		footer.append(input);
	}
	{
		const button = document.createElement("button");
		button.type = "button";
		button.textContent = "収集する";
		button.addEventListener("click", async()=>{
			const text = document.getElementById("_____loadingText");
			text.innerText = `${document.getElementById("season_dropdown").textContent}のカスタムを取得中…\nしばらくお待ち下さい。`;
			text.classList.remove("hiddenContent");
			isLooping = true;
			isTwice = false;
			aho();
			while(isLooping){
				await nextPage(aho);
			}
			text.classList.add("hiddenContent");
		});
		footer.append(button);
	}

}

const putDatas = [];
let isLooping = true;
let isTwice = false;

await Wait.add();	/*終わるボタン押下まで待ち*/


/*＝＝＝＝＝＝＝＝＝＝【データ表示】＝＝＝＝＝＝＝＝＝＝*/

bgs.classList.add("hiddenContent");


const limit = Number(document.getElementById("______limitScore").value);
let extDatas = [...new Set(putDatas)];
extDatas = extDatas.map((level) => {
	const [haba, takasa, bakudan] = level.match(/\d+/g).map((exp) => Number(exp));
	const score = (bakudan * 100 / (haba * takasa)) ** 3 * Math.sqrt(haba * takasa);
	const temp = [
		level,
		Math.floor(score),
	];
	return temp;
});
extDatas = extDatas.filter((data) => data[1] >= limit);
extDatas.sort((a, b) => a[1] - b[1]);
extDatas = extDatas.map((data, index) => {
	return `${index + 1}\t${data[1]}\thttps://minesweeper.online/ja/start/${data[0]}`;
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
			button.textContent = "コピーして終わる";
			button.addEventListener("click", ()=>{
				textarea.select();
				document.execCommand("copy");
				bk.remove();
			});
			footer.append(button);
		}
		{
			const button = document.createElement("button");
			button.type = "button";
			button.textContent = "自分用メモに貼る";
			button.addEventListener("click", ()=>{
				bk.remove();
			});
			footer.append(button);
		}
	}
}




})();
