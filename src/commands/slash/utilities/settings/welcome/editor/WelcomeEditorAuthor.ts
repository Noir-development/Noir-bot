import { ActionRowBuilder, ButtonInteraction, ModalActionRowComponentBuilder, ModalBuilder, ModalMessageModalSubmitInteraction, TextInputBuilder, TextInputStyle } from 'discord.js'
import Options from '../../../../../../constants/Options'
import NoirClient from '../../../../../../structures/Client'
import WelcomeMessage, { WelcomeMessageType } from '../../../../../../structures/WelcomeMessage'
import SettingsUtils from '../../SettingsUtils'
import WelcomeEditor from './WelcomeEditor'

export default class WelcomeEditorAuthor {
  public static async request(client: NoirClient, interaction: ButtonInteraction<'cached'>, id: string, type: WelcomeMessageType) {
    const messageData = await WelcomeMessage.cache(client, id, type)

    const authorInput = new TextInputBuilder()
      .setCustomId(SettingsUtils.generateId('settings', id, 'welcomeEditorAuthor', 'input'))
      .setLabel('Embed author')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter embed author name')
      .setValue(messageData?.author ?? '')
      .setRequired(true)
      .setMaxLength(2000)
      .setMinLength(1)
    const authorImageInput = new TextInputBuilder()
      .setCustomId(SettingsUtils.generateId('settings', id, 'welcomeEditorAuthorImage', 'input'))
      .setLabel('Embed author image')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter image URL or server, user, client')
      .setValue(messageData?.rawAuthorImage ?? '')
      .setRequired(false)
      .setMaxLength(2000)
      .setMinLength(1)

    const actionRows = [
      new ActionRowBuilder<ModalActionRowComponentBuilder>()
        .addComponents(authorInput),
      new ActionRowBuilder<ModalActionRowComponentBuilder>()
        .addComponents(authorImageInput)
    ]

    const modal = new ModalBuilder()
      .setCustomId(SettingsUtils.generateId('settings', id, `welcomeEditorAuthor.${type}`, 'modal'))
      .setTitle('Embed author builder')
      .addComponents(actionRows)

    await interaction.showModal(modal)
  }

  public static async response(client: NoirClient, interaction: ModalMessageModalSubmitInteraction<'cached'>, id: string, type: WelcomeMessageType) {
    const messageData = await WelcomeMessage.cache(client, id, type)

    const authorInput = interaction.fields.getTextInputValue(SettingsUtils.generateId('settings', id, 'welcomeEditorAuthor', 'input'))
    const authorImageInput = interaction.fields.getTextInputValue(SettingsUtils.generateId('settings', id, 'welcomeEditorAuthorImage', 'input'))

    if (!messageData) return

    messageData.author = WelcomeMessage.formatRemove(authorInput)

    if (authorImageInput) {
      const formatted = WelcomeMessage.formatVariable(authorImageInput, { guild: { icon: interaction.guild.iconURL() }, client: { avatar: Options.clientAvatar } })

      messageData.authorImage = formatted == authorImageInput ? undefined : formatted
      messageData.rawAuthorImage = WelcomeMessage.formatRemove(authorImageInput)
    }

    await WelcomeEditor.initialMessage(client, interaction, id, type)
  }
}