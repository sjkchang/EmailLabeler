import QuerySection from "./QuerySection";
import ConditionSection from "./ConditionSection";
import { Flex } from "antd";
const RuleForm = ({ rule, onUpdate, validationError }) => {
    const handleQueryChange = (updatedQuery) =>
        onUpdate({
            ...rule,
            query: updatedQuery,
        });

    const handleConditionsChange = (updatedConditions) =>
        onUpdate({
            ...rule,
            condition: updatedConditions,
        });

    return (
        <Flex vertical justify="flex-start" gap="small">
            <QuerySection
                query={rule.query}
                onQueryChange={handleQueryChange}
                validationError={validationError}
            />
            <ConditionSection
                conditions={rule.condition}
                onConditionsChange={handleConditionsChange}
                validationError={validationError}
            />
        </Flex>
    );
};

export default RuleForm;
