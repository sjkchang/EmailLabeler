import React, { useState, useEffect } from "react";
import RuleForm from "./RuleForm";
import { getAuthToken } from "../utils/auth-utils";
import { Divider, Flex } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { Button, Modal } from "antd";

export class ValidationError extends Error {
    constructor(message, source, index = undefined) {
        super(message);
        this.source = source;
        this.index = index;
    }
}

const Rules = () => {
    const [rules, setRules] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [rule, setRule] = useState({
        id: `rule-${Date.now()}`,
        query: null,
        condition: [{ if: "yes", action: { label: "" } }],
    });
    const [validationError, setValidationError] = useState();

    const postRule = async (transcribedRule) => {
        const authToken = await getAuthToken();

        try {
            const response = await fetch(`http://localhost:3000/rule`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    name: "Rule",
                    prompt: transcribedRule,
                }),
            });

            if (!response.ok) {
                // Handle HTTP errors
                const errorData = await response.json();
                console.error("Error creating rule:", errorData);
                return null;
            }

            const data = await response.json();
            console.log("Rule created successfully:", data);
            return data; // Return the created rule or response data
        } catch (error) {
            console.error("Failed to create rule:", error);
            return null;
        }
    };

    // Returns a string representation of the rule
    // or an empty string if the rule is invalid
    const transcribeRule = (rule) => {
        if (!rule) {
            throw new Error({ message: "Rule is required", source: "rule" });
        }
        if (!rule.query) {
            throw new ValidationError(
                "Rule is must have a query and at least one condition",
                "query"
            );
        }
        if (!rule.condition || rule.condition.length === 0) {
            throw new ValidationError(
                "Rule must have at least one condition",
                "condition"
            );
        }
        rule.condition.forEach((condition, index) => {
            if (!condition.action.label) {
                throw new ValidationError(
                    `All conditions must have an action.`,
                    "action",
                    index
                );
            }
        });

        const query = rule.query?.userInput
            ? `Is/Does this email ${rule.query.userInput}?`
            : "";
        const conditions = rule.condition
            .map(
                (condition) =>
                    `If ${condition.if}, then add a/the label ${condition.action.label}.`
            )
            .join(" ");
        return `${query} ${conditions}`;
    };

    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleOk = async () => {
        setConfirmLoading(true);
        try {
            const transcribedRule = transcribeRule(rule);
            const createdRule = await postRule(transcribedRule);

            setRule({
                id: `rule-${Date.now()}`,
                query: null,
                condition: [{ if: "yes", action: { label: "" } }],
            });
            setValidationError(undefined);
            setRules((prevRules) => [...prevRules, createdRule]);
        } catch (error) {
            console.error(error);
            setValidationError(error);
            setConfirmLoading(false);
            return;
        }
        setConfirmLoading(false);
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setRule({
            id: `rule-${Date.now()}`,
            query: null,
            condition: [{ if: "yes", action: { label: "" } }],
        });
        setValidationError(undefined);
        setIsModalOpen(false);
    };

    useEffect(() => {
        getRules().then((rules) => setRules(rules));

        // Cleanup
        return () => {
            setRules([]);
        };
    }, []);

    const getRules = async () => {
        const authToken = await getAuthToken();

        try {
            const response = await fetch(`http://localhost:3000/rule`, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            if (!response.ok) {
                // Handle HTTP errors
                const errorData = await response.json();
                console.error("Error fetching rules:", errorData);
                return null;
            }

            const data = await response.json();
            console.log("Rules fetched successfully:", data);
            return data; // Return the fetched rules or response data
        } catch (error) {
            console.error("Failed to fetch rules:", error);
            return null;
        }
    };

    const deleteRule = async (ruleId) => {
        const authToken = await getAuthToken();

        try {
            console.log(process.env.REACT_APP_SERVER_URL);
            const response = await fetch(
                `http://localhost:3000/rule/${ruleId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );

            if (!response.ok) {
                // Handle HTTP errors
                const errorData = await response.json();
                console.error("Error deleting rule:", errorData);
                return null;
            }

            const data = await response.json();
            console.log("Rule deleted successfully:", data);

            // Update the rules list
            const updatedRules = rules.filter((rule) => rule._id !== ruleId);
            setRules(updatedRules);

            return data; // Return the fetched rules or response data
        } catch (error) {
            console.error("Failed to delete rule:", error);
            return null;
        }
    };

    const renderRules = () => {
        return rules?.map((rule) => (
            <>
                <Flex key={rule._id} justify="space-between" align="center">
                    {rule.prompt}
                    <Button
                        type="primary"
                        color="danger"
                        variant="outlined"
                        shape="circle"
                        icon={<DeleteOutlined />}
                        onClick={() => deleteRule(rule._id)}
                    />
                </Flex>
                <Divider />
            </>
        ));
    };

    return (
        <div>
            <Flex justify="space-between" align="center">
                <h2>Your Rules</h2>

                <Button type="primary" onClick={showModal}>
                    Create Rule
                </Button>
            </Flex>

            {rules?.length > 0 ? (
                <>{renderRules()}</>
            ) : (
                <>
                    <p>
                        You don't have any email labeling rules. Add some to get
                        started...
                    </p>
                    <Divider />
                </>
            )}

            <Modal
                title="Create a Rule"
                open={isModalOpen}
                onCancel={handleCancel}
                footer={[
                    <Button key="back" onClick={handleCancel}>
                        Cancel
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        loading={confirmLoading}
                        onClick={handleOk}
                    >
                        Save
                    </Button>,
                ]}
            >
                {rule && (
                    <RuleForm
                        key={rule.id}
                        rule={rule}
                        onUpdate={(updatedRule) => setRule(updatedRule)}
                        validationError={validationError}
                    />
                )}
            </Modal>
        </div>
    );
};

export default Rules;
