import { execSync } from "child_process";
import TestUtils from "./test/util";
import run from "./index";
import * as actions from "@actions/core";

describe("src/index", () => {
    let tmpDir: string;

    const consoleInfo = jest.spyOn(console, "info");
    const setFailed = jest.spyOn(actions, "setFailed");

    const {
        createTempDirectory,
        intializeGitRepo,
        getNthCommitBack,
        teardownGitRepo,
        teardownTestDirectory,
        addInvalidCommit,
        addValidCommit,
        setupTestDirectory,
        options,
    } = new TestUtils();

    beforeEach(() => {
        tmpDir = createTempDirectory();
        setupTestDirectory(tmpDir);
        intializeGitRepo();

        process.env.INPUT_EXTRA_CONFIG = "\"@joberstein12/commitlint-config\"";
        process.env.INPUT_TARGET_REF = getNthCommitBack(1);
    });

    afterEach(() => {
        teardownGitRepo();
        teardownTestDirectory(tmpDir);
        
        delete process.env.INPUT_TARGET_REF;
        delete process.env.INPUT_BASE_REF;
        delete process.env.INPUT_HEAD_REF;
        delete process.env.INPUT_EXTRA_CONFIG;

        expect(consoleInfo).toHaveBeenCalled();
    });

    it("Successfully validates a target commit", async () => {
        await run();
        expect(setFailed).not.toHaveBeenCalled();
    });

    it("Successfully validates a range of commits", async () => {
        process.env.INPUT_BASE_REF = "master";
        process.env.INPUT_HEAD_REF = "other";

        execSync("git checkout -qb other", options);
        [ ...Array(3).keys() ].forEach(addValidCommit);
        process.env.INPUT_TARGET_REF = getNthCommitBack(1);

        await run();
        expect(setFailed).not.toHaveBeenCalled();
    });


    it("Fails validation for an invalid commit", async () => {
        addInvalidCommit();
        process.env.INPUT_TARGET_REF = getNthCommitBack(1);

        await run();
        expect(setFailed).toHaveBeenCalledWith('Commit validation failed.');
    });
});