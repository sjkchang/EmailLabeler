import { Input } from "antd";

const QuerySection = ({ query, onQueryChange, validationError }) => (
    <Input
        addonBefore="Is/Does this email "
        defaultValue=""
        addonAfter="?"
        placeholder="E.g. relate to a job application"
        status={validationError?.source === "query" ? "error" : ""}
        onChange={(e) =>
            onQueryChange({
                ...query,
                userInput: e.target.value,
            })
        }
        type="text"
    />
);

export default QuerySection;
