import Rules from "./Rules/RulePage";
import Categorize from "./Categorize";
import { Flex } from "antd";
import { Layout } from "antd";
import { TagsTwoTone } from "@ant-design/icons";
const { Header, Content } = Layout;
import React, { useEffect, useState } from "react";
import { getAuthToken, revokeAuthToken } from "./utils/auth-utils";
import { Button } from "antd";

function App() {
    const [token, setToken] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                const token = await getAuthToken(false);
                setToken(token);
            } catch (error) {
                setError(error);
            }
        };

        checkAuthStatus();
    }, []);

    const handleAuth = async () => {
        try {
            const token = await getAuthToken(true);
            setToken(token);
        } catch (err) {
            setError(err);
        }
    };

    const handleRevokeToken = async () => {
        try {
            const result = await revokeAuthToken();
            setToken(null);
        } catch (error) {
            setError(error);
        }
    };

    return (
        <div>
            {token ? (
                <Layout
                    style={{
                        minWidth: "720px",
                        minHeight: "400px",
                        height: "100%",
                    }}
                >
                    <Header
                        style={{
                            position: "sticky",
                            top: 0,
                            zIndex: 1,
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            background: "#1f1f1f",
                        }}
                    >
                        <h3 style={{ color: "white", width: "100%" }}>
                            Email Auto Labeler <TagsTwoTone />
                        </h3>
                        <Flex
                            justify="flex-end"
                            align="center"
                            gap="middle"
                            style={{
                                width: "100%",
                            }}
                        >
                            <Categorize />
                            <Button type="primary" onClick={handleRevokeToken}>
                                Sign Out
                            </Button>
                        </Flex>
                    </Header>
                    <Content
                        style={{
                            padding: "24px",
                        }}
                    >
                        <div
                            style={{
                                background: "#ffffff",
                                padding: 24,
                                borderRadius: 12,
                            }}
                        >
                            <Rules />
                        </div>
                    </Content>
                </Layout>
            ) : (
                <Button type="primary" onClick={handleAuth}>
                    Sign In
                </Button>
            )}
        </div>
    );
}

export default App;
