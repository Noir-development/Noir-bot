import { ActionRowBuilder, AnySelectMenuInteraction, ButtonBuilder, ButtonInteraction, ChannelSelectMenuBuilder, ChannelSelectMenuInteraction, ChannelType, MessageActionRowComponentBuilder, ModalActionRowComponentBuilder, ModalBuilder, ModalMessageModalSubmitInteraction, TextInputBuilder, TextInputStyle, channelMention } from 'discord.js'
import Colors from '../../../../../constants/Colors'
import Options from '../../../../../constants/Options'
import NoirClient from '../../../../../structures/Client'
import Welcome from '../../../../../structures/Welcome'
import WelcomeMessage from '../../../../../structures/WelcomeMessage'
import SettingsUtils from '../SettingsUtils'

export default class WelcomeWebhook {
  public static async initialMessage(client: NoirClient, interaction: ButtonInteraction<'cached'> | ChannelSelectMenuInteraction<'cached'> | ModalMessageModalSubmitInteraction<'cached'>, id: string) {
    const welcomeData = await Welcome.cache(client, interaction.guildId)
    const welcomeWebhook = await Welcome.getWebhook(client, welcomeData?.webhook ?? '')

    const buttons = [
      [
        new ButtonBuilder()
          .setCustomId(SettingsUtils.generateId('settings', id, 'welcomeWebhookChannel', 'button'))
          .setLabel(`${welcomeData?.webhook ? 'Change' : 'Setup'} welcome channel`)
          .setStyle(SettingsUtils.generateStyle(welcomeData?.webhook))
          .setDisabled(!welcomeData?.status),
        new ButtonBuilder()
          .setCustomId(SettingsUtils.generateId('settings', id, 'welcomeWebhookEdit', 'button'))
          .setLabel('Edit webhook settings')
          .setStyle(SettingsUtils.defaultStyle)
          .setDisabled(!welcomeData?.status || !welcomeWebhook)
      ],
      [
        SettingsUtils.generateBack('settings', id, 'welcomeBack'),
        SettingsUtils.generateSave('settings', id, 'welcomeSave.welcomeWebhook'),
        SettingsUtils.generateRestore('settings', id, 'welcomeRestore.welcomeWebhook')
      ]
    ]

    const actionRows = [
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(buttons[0]),
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(buttons[1])
    ]

    await client.reply.reply({
      interaction: interaction,
      color: Colors.primary,
      author: 'Welcome webhook settings',
      authorImage: Options.clientAvatar,
      description: 'Setup custom webhook for auto-message.',
      fields: [
        {
          name: 'Image variables',
          value: '`{{client avatar}}` Client avatar\n`{{guild icon}}` Server icon',
          inline: false,
        }
      ],
      components: actionRows,
      ephemeral: true,
    })
  }

  public static async channelRequest(client: NoirClient, interaction: ButtonInteraction<'cached'> | ChannelSelectMenuInteraction<'cached'>, id: string) {
    const welcomeData = await Welcome.cache(client, interaction.guildId)

    const buttons = [
      SettingsUtils.generateBack('settings', id, 'welcomeBack.welcomeWebhook'),
      SettingsUtils.generateSave('settings', id, 'welcomeSave.welcomeWebhookChannel'),
      SettingsUtils.generateRestore('settings', id, 'welcomeRestore.welcomeWebhookChannel')
    ]

    const channelSelectMenu = new ChannelSelectMenuBuilder()
      .setCustomId(SettingsUtils.generateId('settings', id, `welcomeWebhookChannel`, 'select'))
      .setPlaceholder('Select channel for messages')
      .setChannelTypes(ChannelType.GuildText)
      .setMaxValues(1)
      .setMinValues(1)


    const selectActionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>()
      .addComponents(channelSelectMenu)
    const buttonActionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>()
      .addComponents(buttons)

    await client.reply.reply({
      interaction: interaction,
      author: 'Welcome webhook channel',
      description: `${welcomeData.webhookChannel ? `Current channel ${channelMention(welcomeData.webhookChannel)}` : 'No channel'}`,
      color: Colors.primary,
      components: [selectActionRow, buttonActionRow]
    })
  }

  public static async editRequest(client: NoirClient, interaction: ButtonInteraction<'cached'>, id: string) {
    const welcomeData = await Welcome.cache(client, interaction.guildId)

    const webhookNameInput = new TextInputBuilder()
      .setCustomId(SettingsUtils.generateId('settings', id, 'welcomeWebhookName', 'input'))
      .setLabel('Webhook name')
      .setPlaceholder('Enter new webhook name')
      .setValue(welcomeData.webhookName ?? '')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
    const webhookAvatarInput = new TextInputBuilder()
      .setCustomId(SettingsUtils.generateId('settings', id, 'welcomeWebhookAvatar', 'input'))
      .setLabel('Webhook avatar')
      .setPlaceholder('Enter a valid image URL or use variables')
      .setValue(welcomeData?.webhookAvatar ?? '')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)

    const actionRows = [
      new ActionRowBuilder<ModalActionRowComponentBuilder>()
        .addComponents(webhookNameInput),
      new ActionRowBuilder<ModalActionRowComponentBuilder>()
        .addComponents(webhookAvatarInput)
    ]

    const modal = new ModalBuilder()
      .setCustomId(SettingsUtils.generateId('settings', id, 'welcomeWebhookEdit', 'modal'))
      .setTitle('Welcome webhook editor')
      .addComponents(actionRows)

    await interaction.showModal(modal)
  }

  public static async channelResponse(client: NoirClient, interaction: ChannelSelectMenuInteraction<'cached'>, id: string) {
    const welcomeData = await Welcome.cache(client, interaction.guildId)
    const channelId = interaction.values[0]

    welcomeData.webhookChannel = channelId

    await this.channelRequest(client, interaction, id)
  }

  public static async editResponse(client: NoirClient, interaction: ModalMessageModalSubmitInteraction<'cached'>, id: string) {
    const welcomeData = await Welcome.cache(client, interaction.guildId)
    const webhookName = interaction.fields.getTextInputValue(SettingsUtils.generateId('settings', id, 'welcomeWebhookName', 'input'))
    const webhookAvatar = interaction.fields.getTextInputValue(SettingsUtils.generateId('settings', id, 'welcomeWebhookAvatar', 'input'))

    welcomeData.webhookName = WelcomeMessage.formatVariable(webhookName, { guild: { icon: interaction.guild.iconURL() }, client: { avatar: Options.clientAvatar } })
    welcomeData.webhookAvatar = WelcomeMessage.formatVariable(webhookAvatar, { guild: { icon: interaction.guild.iconURL() }, client: { avatar: Options.clientAvatar } })

    await this.initialMessage(client, interaction, id)
  }

  public static async buttonResponse(client: NoirClient, interaction: ButtonInteraction<'cached'>, id: string, method: string) {
    if (method == 'welcomeWebhook') {
      await WelcomeWebhook.initialMessage(client, interaction, id)
    }

    else if (method == 'welcomeWebhookChannel') {
      await WelcomeWebhook.channelRequest(client, interaction, id)
    }

    else if (method == 'welcomeWebhookEdit') {
      await WelcomeWebhook.editRequest(client, interaction, id)
    }
  }

  public static async selectResponse(client: NoirClient, interaction: AnySelectMenuInteraction<'cached'>, id: string, method: string) {
    if (method == 'welcomeWebhookChannel' && interaction.isChannelSelectMenu()) {
      await WelcomeWebhook.channelResponse(client, interaction, id)
    }
  }

  public static async modalResponse(client: NoirClient, interaction: ModalMessageModalSubmitInteraction<'cached'>, id: string, method: string) {
    if (method == 'welcomeWebhookEdit') {
      await WelcomeWebhook.editResponse(client, interaction, id)
    }
  }
}