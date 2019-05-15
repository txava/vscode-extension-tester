import { ViewItem } from "../ViewItem";
import { ViewSection } from "../../../../extester";
import { By, WebElement } from 'selenium-webdriver';

/**
 * Default tree item base on the items in explorer view
 */
export class DefaultViewItem extends ViewItem {
    constructor(label: string, viewPart: ViewSection) {
        super(By.xpath(`.//div[@role='treeitem' and @aria-label='${label}']`), viewPart);
        this.label = label;
    }

    async hasChildren(): Promise<boolean> {
        const twistieClass = await this.findElement(By.className('monaco-tl-twistie')).getAttribute('class');
        return twistieClass.indexOf('collapsible') > -1;
    }

    async isExpanded(): Promise<boolean> {
        const twistieClass = await this.findElement(By.className('monaco-tl-twistie')).getAttribute('class');
        return twistieClass.indexOf('collapsed') < 0;
    }

    async getChildren(): Promise<ViewItem[]>{
        const items: ViewItem[] = [];
        if (!await this.isExpanded() && this.hasChildren()) {
            await this.click();
        }

        const rows = await this.enclosingItem.findElements(By.className('monaco-list-row'));
        const baseIndex = await this.findRowIndex(rows);
        const baseLevel = +await this.getAttribute('aria-level');

        for (let i = baseIndex; i < rows.length; i++) {
            if (i === baseIndex) { continue; }
            const level = +await rows[i].getAttribute('aria-level');

            if (level > baseLevel + 1) { continue; }
            if (level <= baseLevel) { break; }

            const label = await rows[i].getAttribute('aria-label');
            items.push(await new DefaultViewItem(label, <ViewSection>this.enclosingItem).wait());
        }

        return items;
    }

    async select(): Promise<void> {
        await this.click();
    }

    private async findRowIndex(rows: WebElement[]): Promise<number> {
        for (let i = 0; i < rows.length; i++) {
            const label = await rows[i].getAttribute('aria-label');
            if (label === this.label) {
                return i;
            }
        }
        throw new Error(`Failed to locate row ${this.getLabel()}`);
    }
}