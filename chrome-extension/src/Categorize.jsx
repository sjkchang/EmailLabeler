import { getAuthToken } from "./utils/auth-utils";
import { Button } from "antd";

function Categorize() {
    const triggerCategorization = async () => {
        let token = await getAuthToken(false);

        fetch(`http://localhost:3000/email/label`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        })
            .then((data) => {
                console.log("Success:", data);
                return data.json();
            })
            .then((json) => {
                console.log("Success:", json);
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    };

    return (
        <Button
            onClick={() => {
                triggerCategorization();
            }}
        >
            Categorize
        </Button>
    );
}

export default Categorize;
