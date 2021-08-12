const edit = {
    dom:{},
    set:()=>{
        edit.dom.textarea = document.getElementById('textarea')
        edit.dom.textarea.addEventListener('keyup',edit.splcheck)
        edit.dom.textarea.addEventListener('change',edit.splcheck)
        edit.dom.textarea.addEventListener('keydown',edit.keydown)
        edit.dom.상태 = document.getElementById('상태');
        edit.dom.apply = document.getElementById('apply')
        edit.dom.saved = document.getElementById('saved')
        edit.dom.apply.addEventListener('click',edit.update)
        fetch('./select/json').then(d=>(d.status==200)?d.text():undefined).then(data=>{
            if(!data) return;
            edit.dom.textarea.value = data
            edit.dom.saved.innerHTML=''
        })
    },
    update:()=>{
        var data = edit.dom.textarea.value;
        try{JSON.parse(edit.dom.textarea.value);
            fetch("./update/json", {
                method: "POST",
                body: data
                }).then(d=>(d.status==200)?d.text():undefined).then(data=>{
                    if(!data) return;
                    edit.dom.textarea.value = data
                    edit.dom.saved.innerHTML=''
                })
        }catch{alert('json 형식 아님!')}
        
    },
    splcheck:()=>{
        try{JSON.parse(edit.dom.textarea.value);
            edit.dom.상태.innerHTML='정상';
            edit.dom.상태.classList.value='정상';
            
            }catch{
            edit.dom.상태.innerHTML='비정상';
            edit.dom.상태.classList.value='비정상';
        }
    },keydown:(e)=>{
        edit.dom.saved.innerHTML='*'
        //https://exceptionshub.com/how-to-handle-tab-in-textarea.html
        //console.log(e)
        
        var target = edit.dom.textarea;
        var value = target.value;
        var start = target.selectionStart;
        var end = target.selectionEnd;
        
        console.log(e.key, e.keyCode , start, end, target, value)

        if(e.key=='Tab'){
            e.preventDefault();
            target.value = value.substr(0,start)+'	'+value.substr(end)
            target.selectionStart = target.selectionEnd = start + 1;
        }
    }
}