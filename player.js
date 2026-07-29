const songs=[


{
name:"测试音乐1",
url:"https://你的音乐地址/song1.mp3"
},


{
name:"测试音乐2",
url:"https://你的音乐地址/song2.mp3"
}


];



let index=0;


const audio=
document.getElementById("audio");


const nameBox=
document.getElementById("songName");


const playBtn=
document.getElementById("play");


const progress=
document.getElementById("progress");


const volume=
document.getElementById("volume");


const list=
document.getElementById("playlist");




function loadSong(){

let song=songs[index];


audio.src=song.url;


nameBox.innerHTML=
song.name;


updateList();

}





function playSong(){

audio.play();

playBtn.innerHTML="⏸";

}



function pauseSong(){

audio.pause();

playBtn.innerHTML="▶";

}





playBtn.onclick=function(){

if(audio.paused){

playSong();

}
else{

pauseSong();

}

};






document.getElementById("next")
.onclick=function(){

index++;

if(index>=songs.length)
index=0;


loadSong();

playSong();

};






document.getElementById("prev")
.onclick=function(){

index--;

if(index<0)
index=songs.length-1;


loadSong();

playSong();

};






audio.ontimeupdate=function(){


if(audio.duration){

progress.value=
audio.currentTime/
audio.duration*100;


}


};





progress.oninput=function(){

audio.currentTime=
progress.value/100*
audio.duration;


};






volume.oninput=function(){

audio.volume=
volume.value;


};






audio.onended=function(){

document
.getElementById("next")
.click();

};






function updateList(){

list.innerHTML="";


songs.forEach(
(song,i)=>{


let li=
document.createElement("li");


li.innerHTML=
song.name;


if(i===index)
li.className="active";



li.onclick=function(){

index=i;

loadSong();

playSong();

};



list.appendChild(li);


});


}





loadSong();
