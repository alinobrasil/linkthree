import React from "react";
import styled from "styled-components";
import { useLinkedIn } from "react-linkedin-login-oauth2";
import linkedin from "react-linkedin-login-oauth2/assets/linkedin.png";
import EAStest from "./components/EAStest";
// import GitHubLogin from 'react-github-login';

function MainPage() {
    const { linkedInLogin } = useLinkedIn({
        clientId: "86vhj2q7ukf83q",
        redirectUri: `${window.location.origin}/linkedin`,
        onSuccess: (code) => {
            console.log(code);
            setCode(code);
            setErrorMessage("");
        },
        scope: "r_emailaddress r_liteprofile",
        onError: (error) => {
            console.log(error);
            setCode("");
            setErrorMessage(error.errorMessage);
        },
    });

    const [code, setCode] = React.useState("");
    const [errorMessage, setErrorMessage] = React.useState("");

    return (

        <div>
            <Wrapper>
                <img
                    onClick={linkedInLogin}
                    src={linkedin}
                    alt="Log in with Linked In"
                    style={{ maxWidth: "180px", cursor: "pointer" }}
                />

                {!code && <div>No code</div>}
                {code && (
                    <div>
                        <div>Authorization Code: {code}</div>
                        <div>
                            Follow{" "}
                            <Link
                                target="_blank"
                                href="https://docs.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow?context=linkedin%2Fconsumer%2Fcontext&tabs=HTTPS#step-3-exchange-authorization-code-for-an-access-token"
                                rel="noreferrer"
                            >
                                this
                            </Link>{" "}
                            to continue
                        </div>
                    </div>
                )}
                {errorMessage && <div>{errorMessage}</div>}
            </Wrapper>



            <EAStest />

        </div>
    );
}

const Wrapper = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Link = styled.a`
  font-size: 20px;
  font-weight: bold;
`;

export default MainPage;