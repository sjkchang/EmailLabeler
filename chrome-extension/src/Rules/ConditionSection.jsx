import { Button, Input, Select } from "antd";
import { PlusCircleOutlined, MinusCircleOutlined } from "@ant-design/icons";
import { Flex } from "antd";

const ConditionForm = ({
    condition,
    conditionIdx,
    onConditionChange,
    onActionChange,
    selectDisabled,
    validationError,
    renderConditionButtons,
}) => {
    const selectBefore = (
        <Select
            defaultValue={condition.if}
            onChange={(value) => {
                onConditionChange(conditionIdx, value);
            }}
            disabled={selectDisabled} // Disable when max conditions exist
        >
            <Option value="yes">If yes, then add a/the label</Option>
            <Option value="no">If no, then add a/the label</Option>
        </Select>
    );

    return (
        <Input
            key={conditionIdx}
            addonBefore={selectBefore}
            defaultValue="mysite"
            value={condition.action?.label || ""}
            addonAfter={renderConditionButtons}
            status={
                validationError?.source === "action" &&
                validationError?.index === conditionIdx
                    ? "error"
                    : ""
            }
            placeholder='e.g. "Job Application"'
            onChange={(e) => {
                onActionChange(conditionIdx, e.target.value);
            }}
            type="text"
        />
    );
};

const ConditionSection = ({
    conditions,
    onConditionsChange,
    validationError,
}) => {
    const setConditionValue = (index, value) => {
        const updatedConditions = [...conditions];
        updatedConditions[index] = {
            ...updatedConditions[index],
            if: value,
        };
        onConditionsChange(updatedConditions);
    };

    const setActionValue = (index, value) => {
        const updatedConditions = [...conditions];
        updatedConditions[index] = {
            ...updatedConditions[index],
            action: {
                ...updatedConditions[index].action,
                label: value,
            },
        };
        onConditionsChange(updatedConditions);
    };

    const renderConditionButtons = (i) => {
        if (conditions.length == 1) {
            return (
                <Button
                    type="primary"
                    color="primary"
                    variant="outlined"
                    size="small"
                    shape="circle"
                    icon={<PlusCircleOutlined />}
                    onClick={() => {
                        const newConditionType =
                            conditions[0].if === "yes" ? "no" : "yes";
                        onConditionsChange([
                            ...conditions,
                            {
                                if: newConditionType,
                                action: { label: "" },
                            },
                        ]);
                    }}
                />
            );
        } else if (conditions.length == 2) {
            return (
                <Button
                    type="primary"
                    color="danger"
                    variant="outlined"
                    size="small"
                    shape="circle"
                    icon={<MinusCircleOutlined />}
                    onClick={() =>
                        onConditionsChange(
                            conditions.filter((_, idx) => idx !== i)
                        )
                    }
                />
            );
        }
    };

    return (
        <Flex vertical justify="flex-start" gap="small">
            {conditions.map((condition, i) => (
                <ConditionForm
                    condition={condition}
                    conditionIdx={i}
                    onConditionChange={setConditionValue}
                    onActionChange={setActionValue}
                    selectDisabled={conditions.length === 2}
                    validationError={validationError}
                    renderConditionButtons={renderConditionButtons(i)}
                />
            ))}
        </Flex>
    );
};

export default ConditionSection;
