if((window.innerHeight > window.innerWidth) || (screen.availHeight > screen.availWidth)){
    alert("Please use landscape mode for the best experience");
}

let CORRECT_PASSWORD;

if(document.title === "Welcome to Vinnie's World!"){
    try {
        const response = await fetch('http://localhost:3000/password');
        if(!response.ok){
            throw new Error("Network response was not ok.");
        }
        const data = await response.json();
        CORRECT_PASSWORD = data.password;
    }
    catch(error){
        console.error("Error fetching data:", error);
    }

    document.getElementById("enter").addEventListener("click", function () {
        if(prompt("Enter password") === CORRECT_PASSWORD){
            location.href = "islands.html";
        }
        else{
            alert("Incorrect Password");
        }
    });
}