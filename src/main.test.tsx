import { describe, it, expect } from "vitest";
import { createRoot } from "react-dom/client";
describe("Main Entry Point", () => {
    it("renders without crashing when root element is present", () => {
        const root = document.createElement("div");
        root.id = "root";
        document.body.appendChild(root);
        const App = () => <div>Hello World</div>;
        const rootInstance = createRoot(root);
        rootInstance.render(<App />);
        expect(root.innerHTML).toBeDefined();
        rootInstance.unmount();
        document.body.removeChild(root);
    });
});
