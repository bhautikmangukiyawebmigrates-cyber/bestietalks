import { useState } from "react";

function Login({ setUser }) {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = () => {

        if (
            (username === "Bhautik" || username === "Hasti")
            &&
            password === "123"
        ) {

            setUser(username);

        } else {

            alert("Invalid Login");
        }
    };

    return (
        <div className="login-page">

            <div className="login-box">

                <h1>BestieTalks ❤️</h1>

                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) =>
                        setUsername(e.target.value)
                    }
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) =>
                        setPassword(e.target.value)
                    }
                />

                <button onClick={handleLogin}>
                    Login
                </button>

            </div>

        </div>
    );
}

export default Login;