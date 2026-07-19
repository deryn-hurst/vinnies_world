if((window.innerHeight > window.innerWidth) || (screen.availHeight > screen.availWidth)){
    alert("Please use landscape mode for the best experience");
}

const CORRECT_PASSWORD = "0652676b73a14c9e162246927f4e74a20ade172ac5623f7f18c76e0130820a62";

if(document.title === "Welcome to Vinnie's World!"){
    async function checkPassword(password) {
        const msgUint8 = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    document.getElementById("enter").addEventListener("click", async function () {
        let pass = prompt("Enter password");
        //await checkPassword(pass);
        while(await checkPassword(pass) !== CORRECT_PASSWORD.toString()){
            pass = prompt("Incorrect password. Re-enter password");
        }
        location.href = "islands.html";
    });
}