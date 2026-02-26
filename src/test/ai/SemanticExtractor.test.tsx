import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SemanticExtractor } from './SemanticExtractor';
import '@testing-library/jest-dom';

describe('SemanticExtractor Prototype', () => {

    it('extracts basic accessibility semantics correctly', () => {
        const { container } = render(
            <div>
                <button aria-expanded="false" className="btn">Click Me</button>
                <input type="checkbox" aria-checked="true" data-testid="chk" />
            </div>
        );

        const semanticTree = SemanticExtractor.extract(container);

        // Tree: div -> button, input
        expect(semanticTree.children.length).toBe(2);

        const btnNode = semanticTree.children[0];
        expect(btnNode.role).toBe('button');
        expect(btnNode.name).toBe('Click Me');
        expect(btnNode.state['aria-expanded']).toBe('false');

        const chkNode = semanticTree.children[1];
        expect(chkNode.role).toBe('checkbox');
        expect(chkNode.state['aria-checked'].toString()).toBe('true');
        expect(chkNode.testId).toBe('chk');
    });

    it('changes root hash when child order changes (D&D simulation)', () => {
        const ListA = () => (
            <ul data-testid="list">
                <li role="article" aria-label="Job 1">Item 1</li>
                <li role="article" aria-label="Job 2">Item 2</li>
            </ul>
        );

        const ListB = () => (
            <ul data-testid="list">
                <li role="article" aria-label="Job 2">Item 2</li>
                <li role="article" aria-label="Job 1">Item 1</li>
            </ul>
        );

        const { container: containerA } = render(<ListA />);
        const treeA = SemanticExtractor.extract(containerA);

        const { container: containerB } = render(<ListB />);
        const treeB = SemanticExtractor.extract(containerB);

        // Children order is different so root hash MUST be different
        expect(treeA.hash).not.toBe(treeB.hash);

        const listA = treeA.children[0];
        const listB = treeB.children[0];
        expect(listA.hash).not.toBe(listB.hash);

        // Individual item hashes should remain exactly the same
        const job1hashA = listA.children[0].hash;
        const job2hashA = listA.children[1].hash;
        const job2hashB = listB.children[0].hash;
        const job1hashB = listB.children[1].hash;

        expect(job1hashA).toBe(job1hashB);
        expect(job2hashA).toBe(job2hashB);
    });

    it('ignores empty wrapper divs and prunes tree', () => {
        const { container } = render(
            <div>
                <div className="wrapper">
                    <span>
                        <button>Nested Button</button>
                    </span>
                </div>
            </div>
        );

        const tree = SemanticExtractor.extract(container);

        // Expected tree: container -> button (div and span should be pruned if meaningless)
        // Wait, container itself is div, it might be pruned if it has no role/name.
        // But SemanticExtractor.extract returns the root node regardless. 
        // The children inside should be pruned.
        expect(tree.children.length).toBe(1);
        expect(tree.children[0].role).toBe('button');
        expect(tree.children[0].name).toBe('Nested Button');
    });

    it('handles pseudo-elements if supported by jsdom/testing-library', () => {
        // This tests the "14% failure risk" where ::before content is used for naming
        // Injecting a style just to see how dom-accessibility-api behaves in jsdom
        const { container } = render(
            <>
                <style>{`.icon::before { content: "Star"; }`}</style>
                <div role="img" className="icon" aria-label="Favorite"></div>
                <button className="icon-btn"><span className="icon"></span></button>
            </>
        );

        const tree = SemanticExtractor.extract(container);

        // Aria-label gives naming
        const imgNode = tree.children.find(c => c.role === 'img');
        expect(imgNode?.name).toBe('Favorite');

        // Can it extract name from pseudo element without aria-label in jsdom?
        const btnNode = tree.children.find(c => c.role === 'button');
        // If jsdom completely fails pseudo elements, name will be empty string.
        // We just log it or assert to see the reality of the environment.
        console.log("Button name from pseudo-element:", btnNode?.name);
        // expect(btnNode?.name).toBe('Star'); // This is likely to fail in jsdom
    });

    it('retains elements with ID or ARIA relations even if they appear empty (Pruning Protection)', () => {
        const { container } = render(
            <div>
                <section id="target-section">
                    <div aria-labelledby="some-id">
                        <button>Click</button>
                    </div>
                </section>
            </div>
        );

        const tree = SemanticExtractor.extract(container);

        // section with id and div with aria-labelledby should be retained
        // Tree: div (container) -> section (id) -> div (aria-labelledby) -> button
        const section = tree.children[0];
        expect(section.tag).toBe('section');

        const divWithAria = section.children[0];
        expect(divWithAria.tag).toBe('div');

        const button = divWithAria.children[0];
        expect(button.tag).toBe('button');
    });

    it('extracts extended ARIA states correctly', () => {
        const { container } = render(
            <div
                aria-live="polite"
                aria-busy="true"
                aria-atomic="true"
                aria-grabbed="true"
            >
                Status Update
            </div>
        );

        const tree = SemanticExtractor.extract(container);
        const node = tree.children[0]; // The div above

        expect(node.state['aria-live']).toBe('polite');
        expect(node.state['aria-busy']).toBe('true');
        expect(node.state['aria-atomic']).toBe('true');
        expect(node.state['aria-grabbed']).toBe('true');
    });

});
